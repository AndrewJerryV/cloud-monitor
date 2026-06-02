import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';

export default function Remediation() {
  const [actions, setActions] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API}/alerts/incidents`);
        const remediationActions = res.data.filter(i => i.remediation && i.remediation.length > 0);
        setActions(remediationActions);
      } catch (err) {
        console.error('Failed to fetch remediation history:', err);
      }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 15000);
    return () => clearInterval(interval);
  }, []);

  const triggerRemediation = async (type) => {
    try {
      await axios.post(`${API}/alerts/incidents`, {
        title: `Manual ${type} remediation`,
        severity: 'medium',
        description: `Triggered manual ${type} remediation action`,
        source: 'manual',
        affectedService: 'system',
      });
    } catch (err) {
      console.error('Failed to trigger remediation:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Automated Remediation</h1>
        <p className="text-sm text-gray-400 mt-1">Remediation actions and history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => triggerRemediation('service-restart')} className="metric-card hover:border-cyan-500/50 transition-all text-left group">
          <RefreshCw className="w-8 h-8 text-cyan-400 mb-2 group-hover:rotate-180 transition-transform" />
          <h3 className="text-sm font-medium text-white">Restart Service</h3>
          <p className="text-xs text-gray-500 mt-1">Restart failed services automatically</p>
        </button>
        <button onClick={() => triggerRemediation('log-cleanup')} className="metric-card hover:border-yellow-500/50 transition-all text-left group">
          <FileText className="w-8 h-8 text-yellow-400 mb-2" />
          <h3 className="text-sm font-medium text-white">Clean Log Files</h3>
          <p className="text-xs text-gray-500 mt-1">Remove old logs when disk is full</p>
        </button>
        <button onClick={() => triggerRemediation('generate-report')} className="metric-card hover:border-green-500/50 transition-all text-left group">
          <FileText className="w-8 h-8 text-green-400 mb-2" />
          <h3 className="text-sm font-medium text-white">Generate Report</h3>
          <p className="text-xs text-gray-500 mt-1">Create incident report</p>
        </button>
      </div>

      <div className="metric-card">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Remediation History</h3>
        {actions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No remediation actions recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map(action => (
              <div key={action.id} className="flex items-start space-x-3 p-3 bg-dark-700/50 rounded-lg">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white font-medium">{action.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      action.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {action.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                  <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                    <span>{new Date(action.createdAt).toLocaleString()}</span>
                    <span>·</span>
                    <span className="capitalize">{action.severity}</span>
                  </div>
                  {action.remediation && action.remediation.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {action.remediation.map((step, i) => (
                        <p key={i} className="text-xs text-gray-400 flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          <span>{step}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
