import React, { useState, useEffect } from 'react';
import { Server, Database, Globe, Cpu } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [services, setServices] = useState([
    { name: 'Backend API', endpoint: '/api/health', status: 'checking' },
    { name: 'Prometheus', endpoint: '/api/health', status: 'checking' },
    { name: 'Grafana', endpoint: '/api/health', status: 'checking' },
    { name: 'Alertmanager', endpoint: '/api/health', status: 'checking' },
  ]);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await axios.get(`${API}/health`);
        setHealth(res.data);
        setServices(prev => prev.map(s => ({ ...s, status: 'healthy' })));
      } catch (err) {
        setHealth(null);
        setServices(prev => prev.map(s => ({ ...s, status: 'unhealthy' })));
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    healthy: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', indicator: 'status-ok' },
    unhealthy: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', indicator: 'status-critical' },
    checking: { color: 'text-gray-400', bg: 'bg-dark-700', border: 'border-dark-600', indicator: 'status-na' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Health</h1>
        <p className="text-sm text-gray-400 mt-1">Service status and health checks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(service => {
          const cfg = statusConfig[service.status];
          return (
            <div key={service.name} className={`metric-card ${cfg.bg} ${cfg.border}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Server className={`w-8 h-8 ${cfg.color}`} />
                  <div>
                    <h3 className="text-sm font-medium text-white">{service.name}</h3>
                    <p className="text-xs text-gray-500">{service.endpoint}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`status-indicator ${cfg.indicator}`}></span>
                  <span className={`text-sm font-medium capitalize ${cfg.color}`}>{service.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {health && (
        <div className="metric-card">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Server Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-sm text-green-400 font-medium">Healthy</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Uptime</p>
              <p className="text-sm text-white font-mono">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Memory Free</p>
              <p className="text-sm text-white font-mono">{(health.memory.free / 1073741824).toFixed(1)} GB</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Load Average</p>
              <p className="text-sm text-white font-mono">{health.loadavg.map(l => l.toFixed(2)).join(', ')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
