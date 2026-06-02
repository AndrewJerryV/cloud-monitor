import React, { useState, useEffect } from 'react';
import { Cpu, MemoryStick, Activity } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import UsageBar from '../components/UsageBar';
import TimeSeriesChart from '../components/TimeSeriesChart';
import AlertBadge from '../components/AlertBadge';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, alertsRes, incidentsRes] = await Promise.all([
          axios.get(`${API}/metrics/current`),
          axios.get(`${API}/alerts`),
          axios.get(`${API}/alerts/incidents`),
        ]);
        setMetrics(metricsRes.data);
        setAlerts(alertsRes.data);
        setIncidents(incidentsRes.data);
        setHistory(prev => {
          const next = [...prev, {
            time: new Date().toLocaleTimeString(),
            cpu: metricsRes.data.cpu,
            memory: metricsRes.data.memory,
          }];
          return next.slice(-20);
        });
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const getStatus = (percent) => {
    if (percent > 90) return 'critical';
    if (percent > 80) return 'warning';
    return 'ok';
  };

  const activeCritical = alerts.filter(a => a.status === 'active' && a.severity === 'critical').length;
  const activeWarning = alerts.filter(a => a.status === 'active' && a.severity === 'warning').length;
  const openIncidents = incidents.filter(i => i.status === 'open').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Infrastructure Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Real-time system monitoring and metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <AlertBadge count={activeCritical} severity="critical" />
          <AlertBadge count={activeWarning} severity="warning" />
          {metrics && (
            <span className="text-xs text-gray-500">
              Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="CPU Usage"
          value={metrics ? metrics.cpu.toFixed(1) : '--'}
          unit="%"
          status={metrics ? getStatus(metrics.cpu) : 'na'}
          icon={Cpu}
          trend={metrics ? (metrics.cpu - 50) : undefined}
        />
        <MetricCard
          title="Memory Usage"
          value={metrics ? metrics.memory.toFixed(1) : '--'}
          unit="%"
          status={metrics ? getStatus(metrics.memory) : 'na'}
          icon={MemoryStick}
        />
        <MetricCard
          title="Active Alerts"
          value={activeCritical + activeWarning}
          unit="alerts"
          status={activeCritical > 0 ? 'critical' : activeWarning > 0 ? 'warning' : 'ok'}
          icon={Activity}
        />
        <MetricCard
          title="Open Incidents"
          value={openIncidents}
          unit="incidents"
          status={openIncidents > 0 ? 'critical' : 'ok'}
          icon={Shield}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="metric-card space-y-4">
          <h3 className="text-sm font-medium text-gray-400">System Resources</h3>
          {metrics && (
            <div className="space-y-4">
              <UsageBar percent={metrics.cpu} label="CPU" color="cyan" />
              <UsageBar percent={metrics.memory} label="Memory" color="purple" />
              {metrics.disk && metrics.disk.map(d => (
                <UsageBar key={d.mount} percent={d.usagePercent} label={`Disk (${d.mount})`} color="green" />
              ))}
            </div>
          )}
        </div>
        <div className="metric-card space-y-3">
          <h3 className="text-sm font-medium text-gray-400">System Info</h3>
          {metrics && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Hostname</span>
                <span className="text-gray-200 font-mono">{metrics.hostname}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platform</span>
                <span className="text-gray-200">{metrics.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Uptime</span>
                <span className="text-gray-200">{formatUptime(metrics.uptime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Load Average</span>
                <span className="text-gray-200 font-mono">
                  {metrics.loadavg.map(l => l.toFixed(2)).join(', ')}
                </span>
              </div>
              {metrics.disk && metrics.disk.map(d => (
                <div key={d.mount} className="flex justify-between">
                  <span className="text-gray-400">Disk Free ({d.mount})</span>
                  <span className="text-gray-200">{(d.free / 1073741824).toFixed(1)} GB</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart data={history} dataKey="cpu" color="#06b6d4" label="CPU Usage Over Time" />
        <TimeSeriesChart data={history} dataKey="memory" color="#a855f7" label="Memory Usage Over Time" />
      </div>
    </div>
  );
}

function Shield(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
