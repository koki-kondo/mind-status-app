import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './StatusTrend.css';

interface TrendData {
  date: string;
  green: number;
  yellow: number;
  red: number;
  total: number;
  dateLabel?: string; // フォーマット済み日付（追加）
}

const StatusTrend: React.FC = () => {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number>(7);

  useEffect(() => {
    fetchTrendData();
  }, [selectedDays]); // selectedDaysが変わったら再取得

  const fetchTrendData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`/api/status/trend_data/?days=${selectedDays}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 日付を日本語形式に変換
      const formattedData = response.data.map((item: TrendData) => ({
        ...item,
        dateLabel: formatDate(item.date)
      }));

      setTrendData(formattedData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${month}/${day}(${weekday})`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{payload[0].payload.dateLabel}</p>
          <p className="tooltip-item green">
            健康: <strong>{payload[0].value}人</strong>
          </p>
          <p className="tooltip-item yellow">
            注意: <strong>{payload[1].value}人</strong>
          </p>
          <p className="tooltip-item red">
            警告: <strong>{payload[2].value}人</strong>
          </p>
          <p className="tooltip-total">
            合計: <strong>{payload[0].payload.total}人</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="trend-container">
        <p className="loading">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="trend-container">
      <div className="trend-header">
        <h2>📈 ステータス推移</h2>
        <div className="period-selector">
          <button 
            className={`period-btn ${selectedDays === 7 ? 'active' : ''}`}
            onClick={() => setSelectedDays(7)}
          >
            7日間
          </button>
          <button 
            className={`period-btn ${selectedDays === 14 ? 'active' : ''}`}
            onClick={() => setSelectedDays(14)}
          >
            14日間
          </button>
          <button 
            className={`period-btn ${selectedDays === 30 ? 'active' : ''}`}
            onClick={() => setSelectedDays(30)}
          >
            30日間
          </button>
        </div>
      </div>
      
      {trendData.length > 0 ? (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={trendData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="dateLabel" 
                stroke="#666"
                style={{ fontSize: '14px' }}
              />
              <YAxis 
                stroke="#666"
                style={{ fontSize: '14px' }}
                label={{ value: '人数', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="green"
                stroke="#10B981"
                strokeWidth={3}
                name="健康"
                dot={{ fill: '#10B981', r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="yellow"
                stroke="#F59E0B"
                strokeWidth={3}
                name="注意"
                dot={{ fill: '#F59E0B', r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="red"
                stroke="#EF4444"
                strokeWidth={3}
                name="警告"
                dot={{ fill: '#EF4444', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="no-data">過去7日間のデータがありません</p>
      )}
    </div>
  );
};

export default StatusTrend;
