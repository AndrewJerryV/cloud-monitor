require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const prometheusMetrics = require('./services/prometheusMetrics');
const systemMetrics = require('./services/systemMetrics');
const alertRoutes = require('./routes/alertRoutes');
const metricRoutes = require('./routes/metricRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.use('/api/metrics', metricRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/health', healthRoutes);

app.get('/api/status', async (req, res) => {
  try {
    const metrics = await systemMetrics.getAllMetrics();
    res.json({ status: 'ok', timestamp: Date.now(), metrics });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheusMetrics.register.contentType);
  res.end(await prometheusMetrics.register.metrics());
});

setInterval(async () => {
  try {
    const metrics = await systemMetrics.getAllMetrics();
    const alertsResp = await fetch(`http://localhost:${PORT}/api/alerts/stats`).then(r => r.json()).catch(() => ({}));
    metrics.activeAlerts = alertsResp.activeAlerts || 0;
    prometheusMetrics.updateMetrics(metrics);
  } catch (err) {
    console.error('Metrics refresh error:', err.message);
  }
}, 10000);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
