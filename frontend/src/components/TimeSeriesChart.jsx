import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TimeSeriesChart({ data, dataKey, color = '#06b6d4', label }) {
  return (
    <div className="metric-card">
      <h3 className="text-sm font-medium text-gray-400 mb-4">{label}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="time" stroke="#606060" tick={{ fontSize: 11 }} />
          <YAxis stroke="#606060" tick={{ fontSize: 11 }} domain={[0, 100]} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
            labelStyle={{ color: '#c0c0c0' }}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
