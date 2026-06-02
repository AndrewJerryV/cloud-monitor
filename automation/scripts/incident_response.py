import json
import time
import logging
import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs', 'remediation.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('incident_response')


def restart_service(service_name):
    """Restart a failed service"""
    try:
        logger.info(f"Attempting to restart service: {service_name}")
        if os.name == 'nt':
            os.system(f'net stop {service_name} && net start {service_name}')
        else:
            os.system(f'systemctl restart {service_name}')
        logger.info(f"Successfully restarted service: {service_name}")
        return {
            'action': 'restart_service',
            'service': service_name,
            'status': 'success',
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to restart service {service_name}: {str(e)}")
        return {
            'action': 'restart_service',
            'service': service_name,
            'status': 'failed',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }


def clean_old_logs(log_dir, retention_days=7):
    """Clean log files older than retention_days"""
    try:
        logger.info(f"Cleaning logs older than {retention_days} days in {log_dir}")
        cutoff = datetime.now() - timedelta(days=retention_days)
        cleaned_count = 0
        freed_space = 0

        log_path = Path(log_dir)
        if not log_path.exists():
            logger.warning(f"Log directory {log_dir} does not exist")
            return {'action': 'clean_logs', 'status': 'failed', 'error': 'Directory not found'}

        for log_file in log_path.glob('*.log'):
            mtime = datetime.fromtimestamp(log_file.stat().st_mtime)
            if mtime < cutoff:
                freed_space += log_file.stat().st_size
                log_file.unlink()
                cleaned_count += 1
                logger.info(f"Deleted old log: {log_file.name}")

        # Also clean rotated logs
        for log_file in log_path.glob('*.log.*'):
            mtime = datetime.fromtimestamp(log_file.stat().st_mtime)
            if mtime < cutoff:
                freed_space += log_file.stat().st_size
                log_file.unlink()
                cleaned_count += 1

        logger.info(f"Cleaned {cleaned_count} files, freed {freed_space / 1024 / 1024:.2f} MB")
        return {
            'action': 'clean_logs',
            'files_cleaned': cleaned_count,
            'freed_space_mb': round(freed_space / 1024 / 1024, 2),
            'status': 'success',
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to clean logs: {str(e)}")
        return {
            'action': 'clean_logs',
            'status': 'failed',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }


def generate_incident_report(incident_data, output_dir):
    """Generate an incident report"""
    try:
        logger.info("Generating incident report")
        os.makedirs(output_dir, exist_ok=True)

        report = {
            'report_id': f"INC-{int(time.time())}",
            'generated_at': datetime.now().isoformat(),
            'incident': incident_data,
            'summary': {
                'title': incident_data.get('title', 'Untitled Incident'),
                'severity': incident_data.get('severity', 'unknown'),
                'affected_service': incident_data.get('affectedService', 'unknown'),
                'detected_at': incident_data.get('createdAt', datetime.now().isoformat()),
                'status': incident_data.get('status', 'open'),
            },
            'remediation_actions': incident_data.get('remediation', []),
            'recommendations': generate_recommendations(incident_data),
        }

        filename = f"incident_report_{report['report_id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = os.path.join(output_dir, filename)
        with open(filepath, 'w') as f:
            json.dump(report, f, indent=2)

        logger.info(f"Report generated: {filepath}")
        return {
            'action': 'generate_report',
            'report_id': report['report_id'],
            'filepath': filepath,
            'status': 'success',
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to generate report: {str(e)}")
        return {
            'action': 'generate_report',
            'status': 'failed',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }


def generate_recommendations(incident_data):
    """Generate recommendations based on incident data"""
    recommendations = []
    severity = incident_data.get('severity', 'low')
    service = incident_data.get('affectedService', 'unknown')

    if severity in ('critical', 'high'):
        recommendations.append(f"Immediate investigation required for {service}")
        recommendations.append(f"Consider scaling up {service} resources")
        recommendations.append("Review monitoring thresholds for this service")

    if severity == 'medium':
        recommendations.append(f"Schedule maintenance window for {service}")
        recommendations.append("Review recent changes to the system")

    recommendations.append(f"Update runbook with findings from {service} incident")
    recommendations.append("Perform post-mortem analysis within 48 hours")

    return recommendations


def record_remediation_action(action_result, log_dir):
    """Record remediation action in the log"""
    try:
        log_file = os.path.join(log_dir, 'remediation_actions.jsonl')
        with open(log_file, 'a') as f:
            f.write(json.dumps(action_result) + '\n')
        logger.info(f"Recorded remediation action: {action_result.get('action')}")
    except Exception as e:
        logger.error(f"Failed to record remediation action: {str(e)}")
