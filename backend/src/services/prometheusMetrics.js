const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const cpuGauge = new client.Gauge({
  name: 'system_cpu_usage_percent',
  help: 'CPU usage percentage',
  registers: [register],
});

const memoryGauge = new client.Gauge({
  name: 'system_memory_usage_percent',
  help: 'Memory usage percentage',
  registers: [register],
});

const diskGauge = new client.Gauge({
  name: 'system_disk_usage_percent',
  help: 'Disk usage percentage',
  labelNames: ['mount'],
  registers: [register],
});

const diskFreeGauge = new client.Gauge({
  name: 'system_disk_free_bytes',
  help: 'Disk free space in bytes',
  labelNames: ['mount'],
  registers: [register],
});

const networkRxGauge = new client.Gauge({
  name: 'system_network_receive_bytes',
  help: 'Network bytes received',
  labelNames: ['interface'],
  registers: [register],
});

const networkTxGauge = new client.Gauge({
  name: 'system_network_transmit_bytes',
  help: 'Network bytes transmitted',
  labelNames: ['interface'],
  registers: [register],
});

const uptimeGauge = new client.Gauge({
  name: 'system_uptime_seconds',
  help: 'System uptime in seconds',
  registers: [register],
});

const activeAlertsGauge = new client.Gauge({
  name: 'alerts_active_total',
  help: 'Total active alerts',
  registers: [register],
});

function updateMetrics(metrics) {
  if (metrics.cpu) cpuGauge.set(metrics.cpu);
  if (metrics.memory) memoryGauge.set(metrics.memory);
  if (metrics.uptime) uptimeGauge.set(metrics.uptime);
  if (metrics.activeAlerts !== undefined) activeAlertsGauge.set(metrics.activeAlerts);
  if (metrics.disk) {
    metrics.disk.forEach(d => {
      if (d.mount) {
        diskGauge.set({ mount: d.mount }, d.usagePercent);
        diskFreeGauge.set({ mount: d.mount }, d.free);
      }
    });
  }
  if (metrics.network) {
    metrics.network.forEach(n => {
      if (n.interface) {
        networkRxGauge.set({ interface: n.interface }, n.rx_bytes);
        networkTxGauge.set({ interface: n.interface }, n.tx_bytes);
      }
    });
  }
}

module.exports = { register, updateMetrics };
