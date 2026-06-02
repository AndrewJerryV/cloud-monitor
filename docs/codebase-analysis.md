# Comprehensive Codebase Analysis: Cloud Infrastructure Monitoring & Incident Response Platform

## Overview

This is a **production-style, full-stack infrastructure monitoring platform** designed for SRE/Cloud/Infrastructure engineering workflows. It implements the complete **observability stack** (metrics, visualization, alerting) plus **automated incident response** — all containerized with Docker.

---

## 1. Architecture & System Design

The platform uses a **microservices-style architecture** with 7 Docker containers on a single `monitoring` bridge network:

| Container | Role | Base Image | Port |
|-----------|------|-----------|------|
| `frontend` | SPA web dashboard | `nginx:alpine` | 80 |
| `backend` | REST API + prom metrics | `node:18-alpine` | 5000 |
| `prometheus` | Time-series metrics DB | `prom/prometheus:latest` | 9090 |
| `node-exporter` | OS-level metric collector | `prom/node-exporter:latest` | 9100 |
| `grafana` | Dashboard visualization | `grafana/grafana:latest` | 3000 |
| `alertmanager` | Alert routing & notification | `prom/alertmanager:latest` | 9093 |
| `automation` | Python remediation engine | `python:3.11-slim` | (none) |

**Data flow:** Frontend → Backend API → Prometheus (scraped metrics) + Alertmanager → Python automation engine (polling backend health). Grafana queries Prometheus directly.

---

## 2. Backend (`backend/`) — Node.js + Express

**Entry:** `backend/src/index.js`

### Dependencies (from `package.json`):

| Library | Purpose |
|---------|---------|
| `express` ^4.18.2 | HTTP server & routing framework |
| `cors` ^2.8.5 | Cross-origin resource sharing middleware |
| `prom-client` ^14.2.0 | Prometheus metrics exposition (from `prometheus` npm org) |
| `node-os-utils` ^1.3.7 | OS metrics (CPU, memory, disk) |
| `dotenv` ^16.3.1 | Environment variable loading from `.env` |
| `morgan` ^1.10.0 | HTTP request logging middleware |
| `express-validator` ^7.0.1 | Request body validation |
| `uuid` ^9.0.0 | UUID generation for alerts/incidents |
| `nodemon` ^3.0.2 (dev) | Auto-restart on file changes in dev mode |

### What the backend does:

**a) REST API Layer** — Three route modules:

- **`/api/metrics`** (`metricRoutes.js`): Endpoints for CPU, memory, disk, network, uptime. Calls `systemMetrics.js` service. Also exposes full `/api/metrics/current` and refreshes Prometheus gauges on each call.

- **`/api/alerts`** (`alertRoutes.js`): Full CRUD for alerts and incidents. Data stored as JSON files (`data/alerts.json`, `data/incidents.json`). Supports create, acknowledge, resolve lifecycle. Also a `/api/alerts/stats` aggregation endpoint.

- **`/api/health`** (`healthRoutes.js`): Health check endpoints: `/` (full health), `/ready` (readiness probe), `/live` (liveness probe). Uses `os` module for memory/load/uptime.

**b) Prometheus Metrics Service** (`prometheusMetrics.js`):

- Creates a custom Prometheus registry using `prom-client`
- Registers 8 custom gauges: `system_cpu_usage_percent`, `system_memory_usage_percent`, `system_disk_usage_percent` (with `mount` label), `system_disk_free_bytes` (with `mount` label), `system_network_receive_bytes` (with `interface` label), `system_network_transmit_bytes` (with `interface` label), `system_uptime_seconds`, `alerts_active_total`
- Also collects default Node.js metrics via `client.collectDefaultMetrics()`
- A 10-second `setInterval` refreshes these gauges from `systemMetrics` + alert stats
- `/metrics` endpoint serves the Prometheus-formatted text at `register.contentType`

**c) System Metrics Service** (`systemMetrics.js`):

- **CPU**: Uses `node-os-utils` `cpu.usage()`, falls back to manual `/proc/stat`-style calculation from `os.cpus()`
- **Memory**: Uses `os.totalmem()` / `os.freemem()` ratio
- **Disk**: Platform-aware — Windows uses `wmic logicaldisk`, Linux uses `df -B1`. Returns mounts with total/free/usagePercent
- **Network**: Iterates `os.networkInterfaces()`, skips loopback, uses placeholder randomized byte counts (not real `/proc/net/dev`)
- **Uptime**: `os.uptime()`

---

## 3. Frontend (`frontend/`) — React 18 + Vite + Tailwind CSS

### Build tooling:

- **Vite 5** as bundler/dev server (fast HMR, ESBuild-based)
- **@vitejs/plugin-react** for JSX transform
- **Tailwind CSS 3.3** with `@tailwindcss/forms` plugin
- **PostCSS** with `autoprefixer`
- Custom dark theme color palette (`dark-50` through `dark-950`)

### Dependencies:

| Library | Purpose |
|---------|---------|
| `react` ^18.2.0 | UI framework |
| `react-dom` ^18.2.0 | DOM rendering |
| `react-router-dom` ^6.20.0 | Client-side routing (5 routes) |
| `recharts` ^2.10.3 | Time-series line charts (CPU/Memory over time) |
| `axios` ^1.6.2 | HTTP client for API calls |
| `lucide-react` ^0.294.0 | SVG icon library |

### Pages (5 routes):

1. **Dashboard** (`/`) — Main overview showing 4 MetricCards (CPU, Memory, Active Alerts, Open Incidents), UsageBars for system resources, System Info panel, and two TimeSeriesCharts. Polls every 5 seconds.
2. **Alerts** (`/alerts`) — Filterable alert list (all/active/acknowledged/resolved). Acknowledge and Resolve buttons. Polls every 10 seconds.
3. **Incidents** (`/incidents`) — Incident tracking with severity badges, resolve workflow. Shows remediation actions inline. Polls every 15 seconds.
4. **System Health** (`/health`) — Service status cards with colored indicators, server details panel. Polls every 10 seconds.
5. **Remediation** (`/remediation`) — Manual trigger buttons (Restart Service, Clean Log Files, Generate Report) plus remediation history log. Polls every 15 seconds.

### Components:

- **Sidebar**: Navigation panel with 5 NavLinks, "CloudInfra" branding, active state highlighting
- **MetricCard**: Reusable card with icon, value, unit, status indicator dot, optional trend arrow
- **UsageBar**: Horizontal progress bar with color changes at 80%/90% thresholds
- **TimeSeriesChart**: Wraps Recharts `LineChart` with consistent dark theme styling
- **AlertBadge**: Colored count badge (red/yellow/blue)

### Infrastructure:

- Nginx reverse proxy (`nginx.conf`) serves static build files and proxies `/api` to backend
- Docker multi-stage: Vite builds to `build/`, then Nginx Alpine serves them
- `vite.config.js` proxies `/api` to `localhost:5000` during dev

---

## 4. Prometheus & Alerting

### Prometheus (`prometheus/`):

- `prometheus.yml`: Global 15s scrape interval, scrapes 3 jobs: `prometheus` (itself), `node` (node-exporter:9100), `backend` (backend:5000/metrics, 10s interval). cAdvisor commented out.
- `alerts.yml`: 10 alert rules across severity tiers:
  - **Warning**: 80% CPU (1m), 80% memory (2m), 90% disk (2m), >1GB/s network (5m), <1GB free disk (5m)
  - **Critical**: 90% CPU (30s), 90% memory (1m), 95% disk (1m), service down (30s), host unreachable (1m)
  - Uses PromQL with `for` durations and Go `{{ }}` template annotations

### Alertmanager (`alertmanager/`):

- `alertmanager.yml`: Routes alerts by severity to different receivers
- 3 receivers: `default` (webhook to backend), `critical-team` (webhook + Slack), `warning-team` (webhook + Slack)
- Slack and SMTP configured with placeholder values
- **Inhibition rules**: Critical alerts suppress warning alerts for the same `alertname`
- Grouping by `alertname` + `severity` with 30s group_wait, 2m group_interval

---

## 5. Grafana

### Auto-provisioned via YAML configs:

- `datasource.yml`: Creates a Prometheus datasource pointing to `http://prometheus:9090`
- `dashboards.yml`: Configures file-based dashboard provider at `/var/lib/grafana/dashboards`

### Dashboard (`infrastructure-monitoring.json`):

625-line JSON with 12 panels:

- **Row 1 "System Resources"**: CPU gauge, Memory gauge, Disk gauge (threshold-based coloring)
- CPU & Memory time-series (overlaid, 12h wide), Network Activity (RX/TX rates)
- **Row 2 "System Status & Alerts"**: Backend status stat, Node Exporter status stat, Uptime stat, Active Alerts stat
- Disk usage over time, Alert history over time
- Dark theme, 10s auto-refresh, 1-hour default time range

---

## 6. Automation Layer — Python Remediation Engine

**Directory structure:** `automation/scripts/` contains 3 Python modules + `config.py`

### Dependencies (`requirements.txt`):

| Library | Purpose |
|---------|---------|
| `requests` 2.31.0 | HTTP calls to backend API |
| `psutil` 5.9.6 | System metrics (CPU/memory/disk) |
| `python-dotenv` 1.0.0 | `.env` loading |
| `schedule` 1.2.0 | Periodic task scheduling in daemon mode |

Also has **vendored** copies of `requests`, `urllib3`, `idna`, `psutil` in `automation/vendor/` (bundled for offline/air-gapped deployment).

### `config.py`:

Loads env vars with defaults: `BACKEND_URL`, `LOG_DIR`, `REPORT_DIR`, `CPU_THRESHOLD` (80), `MEMORY_THRESHOLD` (80), `DISK_THRESHOLD` (90), `CHECK_INTERVAL` (30s), `LOG_RETENTION_DAYS` (7).

### `health_checker.py`:

- **`check_system_health()`**: GETs `/api/status` from backend, logs CPU/Memory/Uptime
- **`check_thresholds(metrics)`**: Compares CPU/Memory/Disk against configured thresholds, returns alert dicts with severity escalation (80% → warning, 90% → critical)
- **`send_alert_to_backend(alert)`**: POSTs alert to `/api/alerts`
- **`run_health_check()`**: Orchestrates a full cycle — fetch metrics, check thresholds, send alerts, handle backend-down case

### `incident_response.py`:

- **`restart_service(name)`**: Platform-aware service restart — `net stop/start` on Windows, `systemctl restart` on Linux. Returns structured result dict.
- **`clean_old_logs(log_dir, retention_days)`**: Scans `.log` and `.log.*` files, removes those older than retention period, tracks freed space. Cross-platform `Path`-based.
- **`generate_incident_report(incident_data, output_dir)`**: Writes JSON report files with recommendations
- **`generate_recommendations(incident_data)`**: Produces severity-based action items (investigate, scale up, schedule maintenance, post-mortem)
- **`record_remediation_action(action_result, log_dir)`**: Appends JSONL to `remediation_actions.jsonl`
- All functions log to both `logs/remediation.log` and stdout

### `remediation_engine.py` (entry point):

- **`check_and_remediate_disk()`**: If disk exceeds threshold, runs `clean_old_logs()`, generates incident report with cleanup details
- **`check_and_remediate_services()`**: Pings backend `/api/health`, restarts if down, generates incident report
- **`generate_periodic_report()`**: Creates periodic JSON status reports
- **`run_remediation_cycle()`**: Orchestrates all three steps
- **CLI**: `--mode once` (single run) or `--mode daemon` (uses `schedule` library for periodic execution). Default interval 30 seconds.

---

## 7. Container Orchestration (`docker-compose.yml`)

- **Network**: Custom `monitoring` bridge network
- **Volumes**: `prometheus_data` (time-series storage), `grafana_data` (dashboard state)
- **Dependency chain**: Grafana → Prometheus, Backend → Prometheus + Alertmanager, Frontend → Backend, Automation → Backend
- **Restart policy**: `unless-stopped` on all containers
- **Build context**: Frontend and backend build from their local Dockerfiles; Prometheus, Grafana, Alertmanager, Node Exporter use official images

---

## 8. Testing (`test-platform.ps1`)

A 217-line PowerShell test script that validates the entire platform:

- **Container checks**: Verifies all 7 containers are running via `docker compose ps`
- **Frontend**: 5 tests — homepage loads, HTML title exists, all 4 SPA routes return 200
- **Backend API**: 8 tests — health endpoint, full status metrics, individual metric endpoints (CPU/memory/disk/network/uptime)
- **Prometheus**: Verifies all 5 metric families are present at `/metrics`
- **Alert CRUD**: 4 tests — create alert, list contains it, acknowledge, resolve
- **Incident CRUD**: 3 tests — create, list, resolve
- **Stats**: Alert stats endpoint
- **External services**: 4 tests — Grafana, Prometheus, Alertmanager, Node Exporter respond
- **Automation**: Checks for recent automation container logs

Uses `curl.exe` (Windows) with temporary files, returns pass/fail counts, exits non-zero on failures.

---

## 9. Technology Stack Summary

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, React Router 6, Recharts, Axios, Lucide Icons |
| **Build Tooling** | Vite 5, ESBuild, PostCSS, Autoprefixer |
| **CSS** | Tailwind CSS 3.3, Custom dark theme palette |
| **Backend** | Node.js 18, Express 4, Morgan, CORS, express-validator |
| **Metrics** | prom-client (Prometheus), node-os-utils, OS built-in modules |
| **Monitoring DB** | Prometheus (time-series) |
| **Visualization** | Grafana 9.5 (auto-provisioned dashboards) |
| **Alerting** | Alertmanager with Slack/email/webhook routing |
| **Container Runtime** | Docker Compose (7 containers), bridge network |
| **Automation** | Python 3.11, psutil, requests, schedule, python-dotenv |
| **Testing** | PowerShell script (manual integration tests) |
| **Operating System** | Cross-platform (Windows/Linux detection throughout) |

---

## 10. Design Patterns & Architecture Decisions

- **File-based persistence**: Alerts and incidents stored as JSON files (no database dependency). Suitable for demo/portfolio but not production.
- **Polling vs WebSockets**: Frontend uses 5-15 second `setInterval` polling (not real-time push). Backend uses 10-second `setInterval` for metric refresh.
- **Vendored Python deps**: `automation/vendor/` bundles third-party libraries for offline deployment.
- **Prometheus pull model**: Backend exposes `/metrics` endpoint, Prometheus scrapes it (standard Prometheus architecture).
- **Separation of concerns**: Backend handles API + metrics exposition, Python handles remediation logic, Prometheus handles alert rule evaluation.
- **Threshold tiering**: Two-tier thresholds (warning/critical) at 80% and 90-95% for CPU/memory/disk.
- **Inhibition rules**: Critical alerts suppress warning alerts to reduce noise.
