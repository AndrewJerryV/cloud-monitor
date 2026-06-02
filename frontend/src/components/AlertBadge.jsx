import React from 'react';

export default function AlertBadge({ count, severity }) {
  if (!count || count === 0) return null;
  const colors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[severity] || colors.info}`}>
      {count}
    </span>
  );
}
