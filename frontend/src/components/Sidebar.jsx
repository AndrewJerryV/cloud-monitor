import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, AlertTriangle, Server, Shield, FileText, Cpu } from 'lucide-react';

const navItems = [
  { to: '/', icon: Activity, label: 'Dashboard' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { to: '/incidents', icon: Shield, label: 'Incidents' },
  { to: '/health', icon: Server, label: 'System Health' },
  { to: '/remediation', icon: FileText, label: 'Remediation' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col">
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center space-x-3">
          <Cpu className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-lg font-bold text-white">CloudInfra</h1>
            <p className="text-xs text-gray-400">Monitoring Platform</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span className="status-indicator status-ok"></span>
          <span>All Systems Online</span>
        </div>
      </div>
    </aside>
  );
}
