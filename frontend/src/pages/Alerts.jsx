import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Eye, Filter } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axios.get(`${API}/alerts`);
        setAlerts(res.data);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (id) => {
    try {
      await axios.put(`${API}/alerts/${id}/acknowledge`);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged', acknowledgedAt: new Date().toISOString() } : a));
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleResolve = async (id) => {
    try {
      await axios.put(`${API}/alerts/${id}/resolve`);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved', resolvedAt: new Date().toISOString() } : a));
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.status === filter);

  const getSeverityIcon = (severity) => {
    if (severity === 'critical') return <AlertTriangle className="w-5 h-5 text-red-400" />;
    if (severity === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <AlertTriangle className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="text-sm text-gray-400 mt-1">Monitor and manage system alerts</p>
        </div>
        <div className="flex items-center space-x-2 bg-dark-800 rounded-lg p-1 border border-dark-600">
          {['all', 'active', 'acknowledged', 'resolved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-all ${
                filter === f ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="metric-card text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-400">No {filter === 'all' ? '' : filter} alerts</p>
          </div>
        )}
        {filtered.map(alert => (
          <div key={alert.id} className="metric-card flex items-center justify-between">
            <div className="flex items-start space-x-4">
              {getSeverityIcon(alert.severity)}
              <div>
                <h3 className="text-sm font-medium text-white">{alert.message}</h3>
                <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                  <span className={`capitalize px-1.5 py-0.5 rounded ${
                    alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                    alert.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {alert.severity}
                  </span>
                  <span>{alert.source}</span>
                  <span>{new Date(alert.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {alert.status === 'active' && (
                <>
                  <button onClick={() => handleAcknowledge(alert.id)} className="px-3 py-1.5 bg-dark-700 hover:bg-dark-600 rounded text-xs text-gray-300 transition-colors flex items-center space-x-1">
                    <Eye className="w-3 h-3" /><span>Acknowledge</span>
                  </button>
                  <button onClick={() => handleResolve(alert.id)} className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 rounded text-xs text-green-400 transition-colors flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" /><span>Resolve</span>
                  </button>
                </>
              )}
              <span className={`text-xs capitalize px-2 py-1 rounded ${
                alert.status === 'active' ? 'bg-red-500/20 text-red-400' :
                alert.status === 'acknowledged' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {alert.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
