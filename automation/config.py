import os
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')
LOG_DIR = os.getenv('LOG_DIR', './logs')
REPORT_DIR = os.getenv('REPORT_DIR', './reports')
CPU_THRESHOLD = float(os.getenv('CPU_THRESHOLD', 80))
MEMORY_THRESHOLD = float(os.getenv('MEMORY_THRESHOLD', 80))
DISK_THRESHOLD = float(os.getenv('DISK_THRESHOLD', 90))
CHECK_INTERVAL = int(os.getenv('CHECK_INTERVAL', 30))
LOG_RETENTION_DAYS = int(os.getenv('LOG_RETENTION_DAYS', 7))
