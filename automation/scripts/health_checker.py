import requests
import json
import time
import logging
import os
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs', 'health_checker.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('health_checker')

BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')


def check_system_health():
    """Check system health metrics"""
    try:
        logger.info("Checking system health...")
        response = requests.get(f"{BACKEND_URL}/api/status", timeout=10)
        if response.status_code == 200:
            data = response.json()
            metrics = data.get('metrics', {})
            logger.info(
                f"CPU: {metrics.get('cpu', 'N/A'):.1f}% | "
                f"Memory: {metrics.get('memory', 'N/A'):.1f}% | "
                f"Uptime: {metrics.get('uptime', 'N/A')}s"
            )
            return metrics
        else:
            logger.warning(f"Health check returned status {response.status_code}")
            return None
    except requests.exceptions.ConnectionError:
        logger.error("Cannot connect to backend - service may be down")
        return None
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return None


def check_thresholds(metrics):
    """Check if any metrics exceed thresholds"""
    alerts = []
    cpu_threshold = float(os.getenv('CPU_THRESHOLD', 80))
    memory_threshold = float(os.getenv('MEMORY_THRESHOLD', 80))
    disk_threshold = float(os.getenv('DISK_THRESHOLD', 90))

    if metrics:
        cpu = metrics.get('cpu', 0)
        if cpu > cpu_threshold:
            alerts.append({
                'type': 'cpu_overload',
                'severity': 'critical' if cpu > 90 else 'warning',
                'message': f'CPU usage is at {cpu:.1f}% (threshold: {cpu_threshold}%)',
                'source': 'health_checker',
            })
            logger.warning(f"CPU threshold exceeded: {cpu:.1f}%")

        memory = metrics.get('memory', 0)
        if memory > memory_threshold:
            alerts.append({
                'type': 'memory_overload',
                'severity': 'critical' if memory > 90 else 'warning',
                'message': f'Memory usage is at {memory:.1f}% (threshold: {memory_threshold}%)',
                'source': 'health_checker',
            })
            logger.warning(f"Memory threshold exceeded: {memory:.1f}%")

        disk_usage = metrics.get('disk', [])
        for disk in disk_usage:
            usage = disk.get('usagePercent', 0)
            if usage > disk_threshold:
                alerts.append({
                    'type': 'disk_full',
                    'severity': 'critical' if usage > 95 else 'warning',
                    'message': f'Disk {disk.get("mount", "unknown")} is at {usage:.1f}% (threshold: {disk_threshold}%)',
                    'source': 'health_checker',
                })
                logger.warning(f"Disk threshold exceeded on {disk.get('mount')}: {usage:.1f}%")

    return alerts


def send_alert_to_backend(alert):
    """Send alert to backend API"""
    try:
        response = requests.post(f"{BACKEND_URL}/api/alerts", json=alert, timeout=5)
        if response.status_code == 201:
            logger.info(f"Alert sent: {alert.get('message', '')[:50]}...")
            return response.json()
        else:
            logger.warning(f"Failed to send alert: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Failed to send alert to backend: {str(e)}")
        return None


def run_health_check():
    """Run complete health check cycle"""
    logger.info("=" * 50)
    logger.info("Starting health check cycle")
    logger.info("=" * 50)

    metrics = check_system_health()
    if metrics:
        alerts = check_thresholds(metrics)
        for alert in alerts:
            send_alert_to_backend(alert)

        if not alerts:
            logger.info("All metrics within normal thresholds")
    else:
        alert = {
            'type': 'service_down',
            'severity': 'critical',
            'message': 'Backend service is unreachable',
            'source': 'health_checker',
        }
        send_alert_to_backend(alert)
        logger.error("Backend service is DOWN - sent critical alert")

    logger.info("Health check cycle complete")
    return metrics
