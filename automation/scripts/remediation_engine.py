import json
import time
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from scripts.incident_response import restart_service, clean_old_logs, generate_incident_report, record_remediation_action
from scripts.health_checker import run_health_check
import config

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(config.LOG_DIR, 'remediation_engine.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('remediation_engine')


def check_and_remediate_disk():
    """Check disk usage and clean logs if needed"""
    from scripts.health_checker import check_system_health

    metrics = check_system_health()
    if not metrics:
        return

    disk_usage = metrics.get('disk', [])
    for disk in disk_usage:
        usage = disk.get('usagePercent', 0)
        mount = disk.get('mount', 'unknown')

        if usage > config.DISK_THRESHOLD:
            logger.warning(f"Disk {mount} at {usage:.1f}% - initiating cleanup")
            result = clean_old_logs(config.LOG_DIR, config.LOG_RETENTION_DAYS)
            record_remediation_action(result, config.LOG_DIR)

            if result.get('status') == 'success' and result.get('freed_space_mb', 0) > 0:
                incident_data = {
                    'title': f'High disk usage on {mount}',
                    'severity': 'warning',
                    'description': f'Disk usage reached {usage:.1f}%. Cleaned {result.get("files_cleaned", 0)} old log files.',
                    'affectedService': 'storage',
                    'status': 'resolved',
                    'remediation': [
                        f"Cleaned {result.get('files_cleaned', 0)} old log files",
                        f"Freed {result.get('freed_space_mb', 0):.2f} MB of disk space",
                        "Log retention policy applied"
                    ]
                }
                generate_incident_report(incident_data, config.REPORT_DIR)


def check_and_remediate_services():
    """Check service health and restart if needed"""
    import requests

    services = [
        {'name': 'backend', 'url': f'{config.BACKEND_URL}/api/health'},
    ]

    for service in services:
        try:
            response = requests.get(service['url'], timeout=5)
            if response.status_code != 200:
                logger.warning(f"Service {service['name']} returned {response.status_code}")
                result = restart_service(service['name'])
                record_remediation_action(result, config.LOG_DIR)

                if result.get('status') == 'success':
                    incident_data = {
                        'title': f'{service["name"]} service restarted',
                        'severity': 'medium',
                        'description': f'{service["name"]} was unresponsive and has been restarted',
                        'affectedService': service['name'],
                        'status': 'resolved',
                        'remediation': [f"Auto-restarted {service['name']} service"]
                    }
                    generate_incident_report(incident_data, config.REPORT_DIR)
        except requests.exceptions.ConnectionError:
            logger.error(f"Cannot connect to {service['name']}")
            result = restart_service(service['name'])
            record_remediation_action(result, config.LOG_DIR)
        except Exception as e:
            logger.error(f"Error checking service {service['name']}: {str(e)}")


def generate_periodic_report():
    """Generate a periodic system status report"""
    from scripts.health_checker import check_system_health

    metrics = check_system_health()
    if metrics:
        report = {
            'title': 'Periodic System Status Report',
            'severity': 'info',
            'description': f"CPU: {metrics.get('cpu', 0):.1f}%, Memory: {metrics.get('memory', 0):.1f}%",
            'affectedService': 'system',
            'status': 'resolved',
            'remediation': ['Periodic health check completed'],
            'createdAt': datetime.now().isoformat(),
        }
        generate_incident_report(report, config.REPORT_DIR)
        logger.info("Periodic report generated")


def run_remediation_cycle():
    """Run the complete remediation cycle"""
    logger.info("=" * 50)
    logger.info("Starting remediation cycle")
    logger.info("=" * 50)

    try:
        # Step 1: Run health check
        metrics = run_health_check()

        # Step 2: Check and remediate disk
        check_and_remediate_disk()

        # Step 3: Check and remediate services
        check_and_remediate_services()

        logger.info("Remediation cycle complete")
    except Exception as e:
        logger.error(f"Remediation cycle failed: {str(e)}")


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Remediation Engine')
    parser.add_argument('--mode', choices=['once', 'daemon'], default='once', help='Run mode')
    parser.add_argument('--interval', type=int, default=config.CHECK_INTERVAL, help='Check interval in seconds')
    args = parser.parse_args()

    if args.mode == 'daemon':
        import schedule
        logger.info(f"Starting daemon mode with {args.interval}s interval")
        schedule.every(args.interval).seconds.do(run_remediation_cycle)

        while True:
            schedule.run_pending()
            time.sleep(1)
    else:
        run_remediation_cycle()
