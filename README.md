# Cloud Infrastructure Monitoring & Incident Response Platform

A production-style cloud infrastructure monitoring platform with automated incident response, built for SRE/Cloud/Infrastructure engineering workflows.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React + Tailwind)             │
│                         Port 80                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP REST API
┌────────────────────────▼────────────────────────────────────────┐
│                         Backend (Node.js + Express)             │
│                         Port 5000                               │
└──┬──────────┬──────────┬──────────┬──────────┬──────────────────┘
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
┌──────┐ ┌────────┐ ┌────────┐ ┌─────────┐ ┌───────────┐
│Prom  │ │ Node   │ │cAdvisor│ │Grafana  │ │Alert-     │
│etheus│ │Exporter│ │        │ │Port 3000│ │manager    │
│:9090 │ │:9100   │ │:8080   │ │         │ │:9093      │
└──────┘ └────────┘ └────────┘ └─────────┘ └─────┬─────┘
                                                 │
                                          ┌──────▼──────┐
                                          │  Automation │
                                          │  (Python)   │
                                          └─────────────┘
```

## Features

### 🔍 Infrastructure Monitoring
- **CPU Monitoring**: Real-time CPU utilization tracking with historical trends
- **Memory Monitoring**: RAM usage analysis with alerts at configurable thresholds
- **Disk Monitoring**: Storage utilization per mount point with automatic cleanup triggers
- **Network Monitoring**: Inbound/outbound traffic analysis with bandwidth tracking
- **Uptime Monitoring**: Continuous server availability tracking
- **Prometheus Integration**: All metrics exposed via Prometheus endpoints
- **Node Exporter**: Linux system metrics collection

### 📊 Grafana Dashboards
- CPU utilization gauges and time-series charts
- Memory consumption visualization
- Disk usage per mount point
- Network activity (RX/TX) graphs
- Active alerts tracking
- System uptime statistics
- Historical trend analysis (1h, 6h, 24h, 7d)

### 🚨 Alerting System (Alertmanager)
| Alert Rule | Threshold | Severity | Response Time |
|-----------|-----------|----------|---------------|
| CPU Usage | > 80% | Warning | 1 minute |
| CPU Usage | > 90% | Critical | 30 seconds |
| Memory Usage | > 80% | Warning | 2 minutes |
| Memory Usage | > 90% | Critical | 1 minute |
| Disk Usage | > 90% | Warning | 2 minutes |
| Disk Usage | > 95% | Critical | 1 minute |
| Service Down | N/A | Critical | 30 seconds |
| Host Unreachable | N/A | Critical | 1 minute |
| High Network Traffic | > 1 GB/s | Warning | 5 minutes |
| Low Disk Space | < 1 GB free | Warning | 5 minutes |

### 🤖 Automated Incident Response
- **Service Auto-Restart**: Automatically restarts failed services when detected
- **Log Cleanup**: Removes log files older than configurable retention period
- **Incident Reports**: Generates detailed JSON incident reports with recommendations
- **Remediation Logging**: All remediation actions are logged to `automation/logs/remediation.log`
- **Threshold-Based Triggers**: Automated actions triggered by configurable metric thresholds
- **Daemon Mode**: Continuous monitoring with configurable check intervals

### 🖥️ Incident Dashboard
- Real-time system status overview
- Active incident tracking with severity levels
- Alert history with acknowledgment workflow
- Automated remediation history and logs
- Manual remediation trigger buttons
- Service health monitoring

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React 18 + Tailwind CSS + Recharts | Web dashboard & visualization |
| Backend | Node.js + Express + Prometheus Client | REST API & metrics exposition |
| Monitoring | Prometheus + Node Exporter + cAdvisor | Metrics collection & storage |
| Visualization | Grafana 9.x | Professional dashboards |
| Alerting | Alertmanager | Alert routing & notification |
| Automation | Python 3.11 + psutil + schedule | Remediation scripts |
| Containerization | Docker + Docker Compose | Deployment & orchestration |

## Project Structure

```
monitoring-platform/
├── frontend/                       # React dashboard application
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Sidebar.js          # Navigation sidebar
│   │   │   ├── MetricCard.js       # Metric display card
│   │   │   ├── AlertBadge.js       # Alert count badge
│   │   │   ├── UsageBar.js         # Resource usage bar
│   │   │   └── TimeSeriesChart.js  # Time series chart
│   │   ├── pages/                  # Page components
│   │   │   ├── Dashboard.js        # Main monitoring dashboard
│   │   │   ├── Alerts.js           # Alert management page
│   │   │   ├── Incidents.js        # Incident tracking page
│   │   │   ├── SystemHealth.js     # System health page
│   │   │   └── Remediation.js      # Remediation actions page
│   │   ├── App.js                  # App root with routing
│   │   ├── index.js                # Entry point
│   │   └── index.css               # Tailwind CSS imports
│   ├── Dockerfile                  # Multi-stage build
│   ├── nginx.conf                  # Nginx reverse proxy config
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── backend/                        # Express API server
│   ├── src/
│   │   ├── index.js                # Server entry point
│   │   ├── routes/
│   │   │   ├── metricRoutes.js     # Metrics API endpoints
│   │   │   ├── alertRoutes.js      # Alerts & incidents CRUD
│   │   │   └── healthRoutes.js     # Health check endpoints
│   │   └── services/
│   │       ├── prometheusMetrics.js # Prometheus metric definitions
│   │       └── systemMetrics.js    # OS metrics collection
│   ├── Dockerfile
│   ├── package.json
│   └── .env
│
├── automation/                     # Python remediation scripts
│   ├── scripts/
│   │   ├── incident_response.py    # Service restart, log cleanup, reports
│   │   ├── health_checker.py       # System health monitoring
│   │   └── remediation_engine.py   # Orchestration engine
│   ├── logs/                       # Remediation action logs
│   ├── reports/                    # Generated incident reports
│   ├── config.py                   # Configuration & thresholds
│   ├── Dockerfile
│   └── requirements.txt
│
├── prometheus/
│   ├── prometheus.yml              # Prometheus scrape configuration
│   └── alerts.yml                  # Alert rules definition
│
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── datasource.yml      # Auto-provision Prometheus datasource
│   │   └── dashboards/
│   │       └── dashboards.yml      # Dashboard provider config
│   └── dashboards/
│       └── infrastructure-monitoring.json  # Grafana dashboard definition
│
├── alertmanager/
│   └── alertmanager.yml            # Alert routing & notification config
│
├── docker-compose.yml              # Multi-container orchestration
└── README.md                       # Documentation
```

## Setup Instructions

### Prerequisites
- Docker Engine 24+ and Docker Compose v2+
- Git
- Node.js 18+ (for local development)
- Python 3.11+ (for automation scripts)
- 4 GB+ RAM available for containers

### Quick Start (Docker)

```bash
# Clone the repository
git clone <repository-url>
cd monitoring-platform

# Start all services
docker compose up -d

# Verify services are running
docker compose ps

# Check logs
docker compose logs -f
```

### Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Web Dashboard | http://localhost | - |
| Backend API | http://localhost:5000/api | - |
| Prometheus | http://localhost:9090 | - |
| Grafana | http://localhost:3000 | admin / admin |
| Alertmanager | http://localhost:9093 | - |
| Node Exporter | http://localhost:9100 | - |

### Local Development

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

#### Automation Scripts
```bash
cd automation
pip install -r requirements.txt
python -m scripts.remediation_engine --mode once
python -m scripts.remediation_engine --mode daemon --interval 30
```

## API Endpoints

### Metrics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/metrics/current` | All current system metrics |
| GET | `/api/metrics/cpu` | CPU usage percentage |
| GET | `/api/metrics/memory` | Memory usage percentage |
| GET | `/api/metrics/disk` | Disk usage per mount |
| GET | `/api/metrics/network` | Network interface stats |
| GET | `/api/metrics/uptime` | System uptime in seconds |
| GET | `/metrics` | Prometheus-formatted metrics |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | List all alerts |
| POST | `/api/alerts` | Create a new alert |
| PUT | `/api/alerts/:id/acknowledge` | Acknowledge an alert |
| PUT | `/api/alerts/:id/resolve` | Resolve an alert |
| GET | `/api/alerts/stats` | Alert statistics |

### Incidents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts/incidents` | List all incidents |
| POST | `/api/alerts/incidents` | Create an incident |
| PUT | `/api/alerts/incidents/:id/resolve` | Resolve an incident |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Full health check |
| GET | `/api/health/ready` | Readiness probe |
| GET | `/api/health/live` | Liveness probe |

## Resume-Oriented Features

### 🔭 Observability
Implementation of a complete observability stack using the three pillars: metrics (Prometheus), visualization (Grafana), and alerting (Alertmanager). System metrics are collected at 10-15 second intervals and stored for historical analysis. Custom Prometheus metrics are exposed via a Node.js backend using the prom-client library, providing real-time visibility into CPU, memory, disk, network, and uptime metrics.

### 📈 Monitoring
Comprehensive infrastructure monitoring covering all critical system resources. The platform monitors CPU utilization (per-core and aggregate), memory consumption (with breakdown), disk usage (per mount point with I/O metrics), network traffic (RX/TX by interface), and system availability. All metrics are collected via Node Exporter for Linux system metrics and custom application metrics from the backend service.

### ⚡ Alerting
Multi-tier alerting system with configurable thresholds and severity levels. Alertmanager handles alert deduplication, grouping, and routing based on severity (warning/critical). Critical alerts have shorter evaluation windows and repeat intervals (30 minutes) compared to warnings (2 hours). Inhibition rules prevent warning alerts when critical alerts for the same metric are firing.

### 🛡️ Incident Management
Full incident lifecycle management including creation, acknowledgment, and resolution workflows. Incidents track severity (critical/high/medium/low), affected services, timestamps, remediation actions, and resolution status. The incident dashboard provides real-time visibility into open incidents with filtering and search capabilities.

### 🔧 Reliability Engineering
Automated remediation engine that continuously monitors system health and takes corrective actions. Service auto-restart detects when services become unresponsive and restarts them automatically. Log cleanup prevents disk-full scenarios by removing files older than the configurable retention period. All actions are logged and recorded for post-mortem analysis.

### 🤖 Automated Remediation
Python-based remediation engine running in daemon mode with configurable check intervals (default 30 seconds). The engine performs health checks, evaluates metrics against thresholds, and triggers appropriate remediation actions. Integration with the backend API enables alert creation, incident tracking, and report generation. All remediation actions are recorded with timestamps and outcomes for auditing.

## Configuration

### Threshold Configuration
Environment variables for customizing alert thresholds:

```bash
CPU_THRESHOLD=80          # CPU alert threshold (%)
MEMORY_THRESHOLD=80       # Memory alert threshold (%)
DISK_THRESHOLD=90         # Disk alert threshold (%)
LOG_RETENTION_DAYS=7      # Log file retention period
CHECK_INTERVAL=30         # Health check interval (seconds)
```

### Prometheus Configuration
Alert rules are defined in `prometheus/alerts.yml` with the following configurable parameters:
- `expr`: PromQL expression defining the alert condition
- `for`: Duration the condition must persist before firing
- `labels`: Alert metadata (severity, team)
- `annotations`: Human-readable alert descriptions

### Alertmanager Configuration
Alert routing is configured in `alertmanager/alertmanager.yml`:
- `group_by`: Alert grouping strategy
- `group_wait`: Initial grouping wait time
- `group_interval`: Interval for grouping new alerts
- `repeat_interval`: Interval for re-sending resolved alerts
- `receivers`: Notification channels (webhook, Slack, email)

## Troubleshooting

### Common Issues

**Containers fail to start**
```bash
docker compose logs <service-name>
docker compose down && docker compose up -d
```

**Metrics not appearing in Grafana**
- Verify Prometheus targets: http://localhost:9090/targets
- Check datasource configuration in Grafana
- Ensure backend container is exposing /metrics endpoint

**Alerts not firing**
- Check Alertmanager: http://localhost:9093/#/alerts
- Verify alert rules in Prometheus: http://localhost:9090/rules
- Check alert labels match routing configuration

**Frontend not connecting to backend**
- Verify API_URL environment variable
- Check Nginx proxy configuration
- Ensure backend container is healthy: http://localhost:5000/api/health

## License

This project is for educational and demonstration purposes.

## Acknowledgments

Built as a portfolio project demonstrating proficiency in:
- Site Reliability Engineering (SRE)
- Cloud Infrastructure Monitoring
- Incident Response & Management
- DevOps & Automation
- Container Orchestration
- Full-Stack Development
