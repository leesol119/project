import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label, industryName }) => {
  if (active && payload && payload.length > 1) {
    const format = (value) =>
      value >= 1e12 ? `${(value / 1e12).toFixed(1)}조`
      : value >= 1e8 ? `${(value / 1e8).toFixed(1)}억`
      : value.toLocaleString();
      console.log('Tooltip industryName:', industryName);

    return (
      <div className="bg-white border p-2 rounded shadow text-sm">
        <p className="font-semibold text-gray-700">{label}</p>
        <p>기업 : {format(payload[0].value)}</p>
        <p className="text-purple-500">
          업종 평균 ({industryName}) : {format(payload[1].value)}
        </p>
      </div>
    );
  }
  return null;
};

const FinancialChartWithRating = ({ data, title, industryName }) => {
  return (
    <div className="bg-gradient-to-br from-blue-100 via-blue-200 to-blue-100 rounded-xl p-6 shadow-md w-[600px]">
      <h3 className="mb-2 font-semibold text-gray-800">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff66" />
          <XAxis dataKey="year" />
          <YAxis
            tickFormatter={(value) =>
              value >= 1e12 ? `${(value / 1e12).toFixed(1)}조`
              : value >= 1e8 ? `${(value / 1e8).toFixed(1)}억`
              : value.toLocaleString()
            }
          />
          <Tooltip content={(props) => <CustomTooltip {...props} industryName={industryName} />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#1e3a8a"
            strokeWidth={3}
            dot={{ stroke: "#1e3a8a", strokeWidth: 2, r: 4, fill: "#ffffff" }}
            activeDot={{ r: 6 }}
            name="기업"
          />
          <Line
            type="monotone"
            dataKey="average"
            stroke="#a78bfa"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
            name="업종 평균"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FinancialChartWithRating;