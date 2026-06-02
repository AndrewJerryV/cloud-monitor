import React from 'react';

const colorMap = {
  cyan: 'bg-cyan-500',
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
};

export default function UsageBar({ percent, label, color = 'cyan' }) {
  const barColor = percent > 90 ? 'bg-red-500' : percent > 80 ? 'bg-yellow-500' : (colorMap[color] || 'bg-cyan-500');

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300 font-medium">{percent.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
