# 🌾 Wheat Price Forecaster

A data-driven system that predicts wheat prices using time-series forecasting techniques, aiding in strategic decision-making for market interventions and price stabilization.

![image](https://github.com/user-attachments/assets/dc30ad88-d200-48c2-a84c-a199f38453ae)

## 📌 Overview

This project aims to forecast wheat prices based on historical market data using ARIMA (AutoRegressive Integrated Moving Average) models. It is designed to assist government bodies, policy makers, and traders in anticipating price trends and intervening effectively in the market.

Key Features:
- Time-series forecasting using ARIMA
- Data preprocessing and visualization
- React web interface for user interaction
- CSV input for flexible data integration
- Forecast visualization for better decision making

---

## 📊 Dataset

The dataset is collected from the **Department of Consumer Affairs** and includes:
- `state`
- `district`
- `market`
- `commodity`
- `variety`
- `arrival_date`
- `min_price`
- `max_price`
- `modal_price`

The model primarily uses the `arrival_date` and `modal_price` fields to forecast future prices.

---

## 🚀 Technologies Used

- **Python** – Data processing and modeling
- **Pandas, NumPy** – Data manipulation
- **Matplotlib, Seaborn** – Data visualization
- **statsmodels** – ARIMA modeling
- **React** – Web-based user interface

---

