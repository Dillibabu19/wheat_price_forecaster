import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";

import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  LineChart as ChartIcon,
  BarChart as VolumeIcon,
  TrendingUp,
} from "lucide-react";

const Dashboard = () => {
  const [historicalData, setHistoricalData] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [timeframe, setTimeframe] = useState("1y");
  const [view, setView] = useState("price");
  const [predictionDays, setPredictionDays] = useState(30);
  const [modelType, setModelType] = useState("both");
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    fetchStatistics();
  }, [timeframe, view]);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/data?timeframe=${timeframe}&view=${view}`
      );
      const data = await response.json();
      setHistoricalData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/statistics");
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const getPredictions = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          days: predictionDays,
          model: modelType,
        }),
      });
      const data = await response.json();
      setPredictions(data);
    } catch (error) {
      console.error("Error getting predictions:", error);
    }
  };

  const StatisticCard = ({ title, value, icon, change }) => (
    <Card className="bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {change && (
              <p
                className={`text-sm mt-1 flex items-center ${
                  change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {change >= 0 ? (
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 mr-1" />
                )}
                {Math.abs(change).toFixed(2)}%
              </p>
            )}
          </div>
          <div className="p-3 bg-blue-100 rounded-full">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Wheat Price Analysis Dashboard
          </h1>
          <p className="text-gray-500 mt-2">
            Real-time market analysis and price predictions
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatisticCard
              title="Current Price"
              value={`$${statistics.current_price.toFixed(2)}`}
              icon={<ChartIcon className="w-6 h-6 text-blue-600" />}
              change={statistics.price_change}
            />
            <StatisticCard
              title="Trading Volume"
              value={statistics.volume.toLocaleString()}
              icon={<VolumeIcon className="w-6 h-6 text-blue-600" />}
            />
            <StatisticCard
              title="Volatility"
              value={`${(statistics.volatility * 100).toFixed(2)}%`}
              icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
            />
            <StatisticCard
              title="Last Updated"
              value={new Date(statistics.last_update).toLocaleString()}
              icon={<ChartIcon className="w-6 h-6 text-blue-600" />}
            />
          </div>
        )}

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger>
              <SelectValue placeholder="Select Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={view} onValueChange={setView}>
            <SelectTrigger>
              <SelectValue placeholder="Select View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price View</SelectItem>
              <SelectItem value="volume">Volume View</SelectItem>
              <SelectItem value="analysis">Technical Analysis</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={predictionDays.toString()}
            onValueChange={(val) => setPredictionDays(Number(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Prediction Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="14">14 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="60">60 Days</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={getPredictions} className="w-full">
            Generate Prediction
          </Button>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Historical Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="Date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {view === "price" && (
                      <>
                        <Line
                          type="monotone"
                          dataKey="Close"
                          stroke="#2563eb"
                          name="Close Price"
                        />
                        <Line
                          type="monotone"
                          dataKey="MA5"
                          stroke="#059669"
                          name="5-day MA"
                        />
                        <Line
                          type="monotone"
                          dataKey="MA20"
                          stroke="#d97706"
                          name="20-day MA"
                        />
                        <Line
                          type="monotone"
                          dataKey="MA50"
                          stroke="#dc2626"
                          name="50-day MA"
                        />
                      </>
                    )}
                    {view === "volume" && (
                      <>
                        <Line
                          type="monotone"
                          dataKey="Volume"
                          stroke="#2563eb"
                          name="Volume"
                        />
                        <Line
                          type="monotone"
                          dataKey="Volume_MA5"
                          stroke="#059669"
                          name="Volume 5-day MA"
                        />
                        <Line
                          type="monotone"
                          dataKey="Volume_MA20"
                          stroke="#d97706"
                          name="Volume 20-day MA"
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {predictions && (
            <Card>
              <CardHeader>
                <CardTitle>Price Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={predictions.dates.map((date, i) => ({
                        date,
                        ...(predictions.lstm
                          ? { lstm: predictions.lstm[i] }
                          : {}),
                        ...(predictions.arima
                          ? { arima: predictions.arima[i] }
                          : {}),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {predictions.lstm && (
                        <Line
                          type="monotone"
                          dataKey="lstm"
                          stroke="#2563eb"
                          name="LSTM Prediction"
                        />
                      )}
                      {predictions.arima && (
                        <Line
                          type="monotone"
                          dataKey="arima"
                          stroke="#059669"
                          name="ARIMA Prediction"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
