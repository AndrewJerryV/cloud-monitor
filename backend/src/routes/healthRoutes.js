const express = require('express');
const router = express.Router();
const os = require('os');

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: os.uptime(),
    memory: {
      free: os.freemem(),
      total: os.totalmem(),
    },
    loadavg: os.loadavg(),
  });
});

router.get('/ready', (req, res) => {
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

router.get('/live', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

module.exports = router;
