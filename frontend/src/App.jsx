import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import Alerts from './pages/Alerts';
import SystemHealth from './pages/SystemHealth';
import Remediation from './pages/Remediation';

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-dark-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/health" element={<SystemHealth />} />
            <Route path="/remediation" element={<Remediation />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
