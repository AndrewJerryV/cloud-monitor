const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const ALERTS_FILE = path.join(__dirname, '../../data/alerts.json');
const INCIDENTS_FILE = path.join(__dirname, '../../data/incidents.json');

function ensureDataDir() {
  const dir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(ALERTS_FILE)) {
    fs.writeFileSync(ALERTS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(INCIDENTS_FILE)) {
    fs.writeFileSync(INCIDENTS_FILE, JSON.stringify([], null, 2));
  }
}

ensureDataDir();

function readAlerts() {
  try {
    return JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function readIncidents() {
  try {
    return JSON.parse(fs.readFileSync(INCIDENTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeAlerts(alerts) {
  fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2));
}

function writeIncidents(incidents) {
  fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(incidents, null, 2));
}

router.get('/', (req, res) => {
  const alerts = readAlerts();
  res.json(alerts);
});

router.post('/', (req, res) => {
  const { type, severity, message, source } = req.body;
  const alert = {
    id: uuidv4(),
    type: type || 'unknown',
    severity: severity || 'warning',
    message: message || 'No message',
    source: source || 'system',
    status: 'active',
    createdAt: new Date().toISOString(),
    acknowledgedAt: null,
    resolvedAt: null,
  };
  const alerts = readAlerts();
  alerts.push(alert);
  writeAlerts(alerts);
  res.status(201).json(alert);
});

router.put('/:id/acknowledge', (req, res) => {
  const alerts = readAlerts();
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.status = 'acknowledged';
  alert.acknowledgedAt = new Date().toISOString();
  writeAlerts(alerts);
  res.json(alert);
});

router.put('/:id/resolve', (req, res) => {
  const alerts = readAlerts();
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.status = 'resolved';
  alert.resolvedAt = new Date().toISOString();
  writeAlerts(alerts);
  res.json(alert);
});

router.get('/incidents', (req, res) => {
  const incidents = readIncidents();
  res.json(incidents);
});

router.post('/incidents', (req, res) => {
  const { title, severity, description, source, affectedService } = req.body;
  const incident = {
    id: uuidv4(),
    title: title || 'Untitled Incident',
    severity: severity || 'medium',
    description: description || '',
    source: source || 'system',
    affectedService: affectedService || 'unknown',
    status: 'open',
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    remediation: [],
  };
  const incidents = readIncidents();
  incidents.push(incident);
  writeIncidents(incidents);
  res.status(201).json(incident);
});

router.put('/incidents/:id/resolve', (req, res) => {
  const incidents = readIncidents();
  const incident = incidents.find(i => i.id === req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });
  incident.status = 'resolved';
  incident.resolvedAt = new Date().toISOString();
  writeIncidents(incidents);
  res.json(incident);
});

router.get('/stats', (req, res) => {
  const alerts = readAlerts();
  const incidents = readIncidents();
  res.json({
    totalAlerts: alerts.length,
    activeAlerts: alerts.filter(a => a.status === 'active').length,
    acknowledgedAlerts: alerts.filter(a => a.status === 'acknowledged').length,
    resolvedAlerts: alerts.filter(a => a.status === 'resolved').length,
    totalIncidents: incidents.length,
    openIncidents: incidents.filter(i => i.status === 'open').length,
    resolvedIncidents: incidents.filter(i => i.status === 'resolved').length,
  });
});

module.exports = router;
