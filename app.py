from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from wheatprice import WheatPriceForecaster 

# from wheat_price_forecaster.wheatprice import WheatPriceForecaster

app = Flask(__name__)
CORS(app)

# Initialize our forecaster
forecaster = WheatPriceForecaster()
forecaster.load_data('wheatprices.csv')
forecaster.add_technical_indicators()

@app.route('/api/data', methods=['GET'])
def get_data():
    timeframe = request.args.get('timeframe', '1y')
    view = request.args.get('view', 'price')
    
    # Get the data based on timeframe
    if timeframe == '1m':
        data = forecaster.data.last('30D')
    elif timeframe == '3m':
        data = forecaster.data.last('90D')
    elif timeframe == '6m':
        data = forecaster.data.last('180D')
    elif timeframe == '1y':
        data = forecaster.data.last('365D')
    else:
        data = forecaster.data
    
    # Prepare response based on view type
    if view == 'price':
        response_data = data[['Close', 'MA5', 'MA20', 'MA50']].reset_index()
    elif view == 'volume':
        response_data = data[['Volume', 'Volume_MA5', 'Volume_MA20']].reset_index()
    else:  # analysis view
        response_data = data[['Close', 'Volatility', 'Trading_Range', 'ROC']].reset_index()
    
    return jsonify(response_data.to_dict(orient='records'))

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    days_ahead = data.get('days', 30)
    model_type = data.get('model', 'both')
    
    try:
        # Get predictions from both models
        predictions = forecaster.make_predictions(days_ahead=days_ahead)
        
        # Prepare response based on model type
        response = {
            'dates': [(datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d') 
                     for i in range(1, days_ahead + 1)]
        }
        
        if model_type in ['both', 'lstm']:
            response['lstm'] = predictions['lstm'].tolist()
        
        if model_type in ['both', 'arima']:
            response['arima'] = predictions['arima'].tolist()
            
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    current_price = float(forecaster.data['Close'].iloc[-1])
    price_change = float(forecaster.data['Daily_Return'].iloc[-1] * 100)
    volume = int(forecaster.data['Volume'].iloc[-1])
    volatility = float(forecaster.data['Volatility'].iloc[-1])
    
    return jsonify({
        'current_price': current_price,
        'price_change': price_change,
        'volume': volume,
        'volatility': volatility,
        'last_update': forecaster.data.index[-1].strftime('%Y-%m-%d %H:%M:%S')
    })

if __name__ == '__main__':
    app.run(debug=True)