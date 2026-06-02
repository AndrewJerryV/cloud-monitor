const express = require('express');
const router = express.Router();
const systemMetrics = require('../services/systemMetrics');
const prometheusMetrics = require('../services/prometheusMetrics');

router.get('/current', async (req, res) => {
  try {
    const metrics = await systemMetrics.getAllMetrics();
    prometheusMetrics.updateMetrics(metrics);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/cpu', async (req, res) => {
  try {
    const cpu = await systemMetrics.getCPUUsage();
    res.json({ cpu, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/memory', (req, res) => {
  try {
    const memory = systemMetrics.getMemoryUsage();
    res.json({ memory, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/disk', async (req, res) => {
  try {
    const disk = await systemMetrics.getDiskUsage();
    res.json({ disk, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/network', async (req, res) => {
  try {
    const network = await systemMetrics.getNetworkUsage();
    res.json({ network, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/uptime', (req, res) => {
  try {
    const uptime = systemMetrics.getUptime();
    res.json({ uptime, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
