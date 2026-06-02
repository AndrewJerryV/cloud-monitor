import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await axios.get(`${API}/alerts/incidents`);
        setIncidents(res.data);
      } catch (err) {
        console.error('Failed to fetch incidents:', err);
      }
    };
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id) => {
    try {
      await axios.put(`${API}/alerts/incidents/${id}/resolve`);
      setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: 'resolved', resolvedAt: new Date().toISOString() } : i));
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'medium': return <Info className="w-5 h-5 text-yellow-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Incidents</h1>
        <p className="text-sm text-gray-400 mt-1">Track and manage infrastructure incidents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <p className="text-sm text-gray-400">Total Incidents</p>
          <p className="text-2xl font-bold text-white mt-1">{incidents.length}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-gray-400">Open</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{incidents.filter(i => i.status === 'open').length}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-gray-400">Resolved</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{incidents.filter(i => i.status === 'resolved').length}</p>
        </div>
      </div>

      <div className="space-y-3">
        {incidents.length === 0 && (
          <div className="metric-card text-center py-12">
            <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-400">No incidents reported</p>
          </div>
        )}
        {incidents.map(incident => (
          <div key={incident.id} className="metric-card">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                {getSeverityIcon(incident.severity)}
                <div>
                  <h3 className="text-sm font-medium text-white">{incident.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{incident.description}</p>
                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                    <span className={`px-1.5 py-0.5 rounded border ${getSeverityColor(incident.severity)}`}>
                      {incident.severity}
                    </span>
                    <span>Service: {incident.affectedService}</span>
                    <span>Source: {incident.source}</span>
                    <span>{new Date(incident.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {incident.status === 'open' && (
                  <button onClick={() => handleResolve(incident.id)} className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 rounded text-xs text-green-400 transition-colors flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" /><span>Resolve</span>
                  </button>
                )}
                <span className={`text-xs capitalize px-2 py-1 rounded ${
                  incident.status === 'open' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                }`}>
                  {incident.status}
                </span>
              </div>
            </div>
            {incident.remediation && incident.remediation.length > 0 && (
              <div className="mt-3 pt-3 border-t border-dark-600">
                <p className="text-xs text-gray-500 mb-2">Remediation Actions:</p>
                {incident.remediation.map((action, i) => (
                  <p key={i} className="text-xs text-gray-400">- {action}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
