import React from 'react';

export default function MetricCard({ title, value, unit, status, icon: Icon, trend }) {
  const getStatusColor = (s) => {
    if (s === 'critical') return 'text-red-400';
    if (s === 'warning') return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-400">{title}</span>
        {Icon && <Icon className={`w-5 h-5 ${getStatusColor(status)}`} />}
      </div>
      <div className="flex items-baseline space-x-1">
        <span className="text-3xl font-bold text-white">{value}</span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
      <div className="mt-2 flex items-center space-x-2">
        <span className={`status-indicator ${status === 'critical' ? 'status-critical' : status === 'warning' ? 'status-warning' : status === 'ok' ? 'status-ok' : 'status-na'}`}></span>
        <span className={`text-xs capitalize ${getStatusColor(status)}`}>{status}</span>
        {trend !== undefined && (
          <span className={`text-xs ${trend > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
