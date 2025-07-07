import pandas as pd
import numpy as np
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns
from statsmodels.tsa.arima.model import ARIMA
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
import warnings
warnings.filterwarnings('ignore')

class WheatPriceForecaster:
    def __init__(self):
        self.data = None
        self.scaler = MinMaxScaler()
        self.lstm_model = None
        self.arima_model = None
        
    def load_data(self, csv_file):
        """Load data from CSV file"""
        try:
            # Read the CSV file
            self.data = pd.read_csv(csv_file)
            
            # Convert Date to datetime
            self.data['Date'] = pd.to_datetime(self.data['Date'])
            
            # Set Date as index
            self.data.set_index('Date', inplace=True)
            
            # Sort the data by date
            self.data = self.data.sort_index()
            
            print(f"Data loaded successfully. Shape: {self.data.shape}")
            print(f"Date range: {self.data.index.min()} to {self.data.index.max()}")
            
            return True
        except Exception as e:
            print(f"Error loading data: {e}")
            return False
    
    def add_technical_indicators(self):
        """Add technical indicators to the dataset"""
        # Price Moving Averages
        self.data['MA5'] = self.data['Close'].rolling(window=5).mean()
        self.data['MA20'] = self.data['Close'].rolling(window=20).mean()
        self.data['MA50'] = self.data['Close'].rolling(window=50).mean()
        
        # Volatility Indicators
        self.data['Daily_Return'] = self.data['Close'].pct_change()
        self.data['Volatility'] = self.data['Daily_Return'].rolling(window=20).std()
        
        # Trading Range
        self.data['Trading_Range'] = (self.data['High'] - self.data['Low']) / self.data['Close']
        
        # Volume Indicators
        self.data['Volume_MA5'] = self.data['Volume'].rolling(window=5).mean()
        self.data['Volume_MA20'] = self.data['Volume'].rolling(window=20).mean()
        
        # Price Momentum
        self.data['ROC'] = self.data['Close'].pct_change(periods=5)
        
        # Clean up any NaN values
        self.data.fillna(method='bfill', inplace=True)
        
        return self.data
    
    def prepare_lstm_data(self, lookback=60):
        """Prepare data for LSTM model"""
        # Scale the closing prices
        scaled_data = self.scaler.fit_transform(self.data['Close'].values.reshape(-1, 1))
        
        X, y = [], []
        for i in range(lookback, len(scaled_data)):
            X.append(scaled_data[i-lookback:i, 0])
            y.append(scaled_data[i, 0])
        
        X, y = np.array(X), np.array(y)
        X = X.reshape(X.shape[0], X.shape[1], 1)
        
        # Split data into train and test sets
        train_size = int(len(X) * 0.8)
        X_train, X_test = X[:train_size], X[train_size:]
        y_train, y_test = y[:train_size], y[train_size:]
        
        return X_train, X_test, y_train, y_test
    
    def train_lstm(self, X_train, y_train):
        """Train LSTM model"""
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=(X_train.shape[1], 1)),
            Dropout(0.2),
            LSTM(50, return_sequences=False),
            Dropout(0.2),
            Dense(25),
            Dense(1)
        ])
        
        model.compile(optimizer='adam', loss='mse')
        model.fit(X_train, y_train, batch_size=32, epochs=50, verbose=1)
        self.lstm_model = model
        return model
    
    def train_arima(self):
        """Train ARIMA model"""
        self.arima_model = ARIMA(self.data['Close'], order=(5,1,2))
        self.arima_model = self.arima_model.fit()
        return self.arima_model
    
    def make_predictions(self, days_ahead=30):
        """Make predictions using both models"""
        predictions = {}
        
        # ARIMA predictions
        if self.arima_model is not None:
            predictions['arima'] = self.arima_model.forecast(steps=days_ahead)
        
        # LSTM predictions
        if self.lstm_model is not None:
            last_sequence = self.scaler.transform(
                self.data['Close'].values[-60:].reshape(-1,1)
            )
            
            lstm_predictions = []
            current_sequence = last_sequence[-60:].reshape(1, 60, 1)
            
            for _ in range(days_ahead):
                next_pred = self.lstm_model.predict(current_sequence)[0]
                lstm_predictions.append(next_pred)
                current_sequence = np.roll(current_sequence, -1, axis=1)
                current_sequence[0, -1, 0] = next_pred
            
            predictions['lstm'] = self.scaler.inverse_transform(
                np.array(lstm_predictions).reshape(-1, 1)
            ).flatten()
        
        return predictions
    
    def plot_analysis(self):
        """Create comprehensive price analysis plots"""
        fig = plt.figure(figsize=(20, 12))
        
        # 1. Price and Moving Averages
        ax1 = plt.subplot(2, 2, 1)
        self.data['Close'].plot(label='Close Price', ax=ax1)
        self.data['MA5'].plot(label='5-day MA', ax=ax1)
        self.data['MA20'].plot(label='20-day MA', ax=ax1)
        self.data['MA50'].plot(label='50-day MA', ax=ax1)
        ax1.set_title('Wheat Price and Moving Averages')
        ax1.legend()
        
        # 2. Volume Analysis
        ax2 = plt.subplot(2, 2, 2)
        self.data['Volume'].plot(kind='bar', ax=ax2, alpha=0.3, label='Volume')
        self.data['Volume_MA5'].plot(color='red', ax=ax2, label='5-day MA')
        self.data['Volume_MA20'].plot(color='blue', ax=ax2, label='20-day MA')
        ax2.set_title('Trading Volume Analysis')
        ax2.legend()
        
        # 3. Volatility
        ax3 = plt.subplot(2, 2, 3)
        self.data['Volatility'].plot(ax=ax3)
        ax3.set_title('20-day Rolling Volatility')
        
        # 4. Trading Range
        ax4 = plt.subplot(2, 2, 4)
        self.data['Trading_Range'].plot(ax=ax4)
        ax4.set_title('Daily Trading Range (High-Low)/Close')
        
        plt.tight_layout()
        return fig
    
    def plot_predictions(self, predictions, days_ahead=30):
        """Plot the forecasted prices"""
        last_date = self.data.index[-1]
        forecast_dates = pd.date_range(last_date, periods=days_ahead+1)[1:]
        
        plt.figure(figsize=(15, 7))
        
        # Plot historical data
        plt.plot(self.data.index[-100:], 
                self.data['Close'].tail(100), 
                label='Historical Prices')
        
        # Plot predictions
        if 'arima' in predictions:
            plt.plot(forecast_dates, 
                    predictions['arima'], 
                    '--', 
                    label='ARIMA Forecast')
        
        if 'lstm' in predictions:
            plt.plot(forecast_dates, 
                    predictions['lstm'], 
                    '--', 
                    label='LSTM Forecast')
        
        plt.title('Wheat Price Forecast')
        plt.legend()
        plt.grid(True)
        return plt.gcf()

# Example usage
if __name__ == "__main__":
    # Create instance
    forecaster = WheatPriceForecaster()
    
    # Load data
    forecaster.load_data('wheatprices.csv')  # Replace with your CSV file path
    
    # Add technical indicators
    forecaster.add_technical_indicators()
    
    # Prepare data and train models
    X_train, X_test, y_train, y_test = forecaster.prepare_lstm_data()
    forecaster.train_lstm(X_train, y_train)
    forecaster.train_arima()
    
    # Make predictions
    predictions = forecaster.make_predictions(days_ahead=30)
    
    # Create visualizations
    forecaster.plot_analysis()
    forecaster.plot_predictions(predictions)
    plt.show()