# Architecture Diagram

A text-based architecture diagram. For a production setup, generate an actual image 
using tools like Draw.io, Excalidraw, or Mermaid CLI.

## System Architecture

```mermaid
graph TB
    subgraph "Internet"
        U[User Browser]
    end

    subgraph "Docker Network: monitoring"
        subgraph "Frontend Tier"
            F[React App<br/>Port 80]
            N[Nginx<br/>Reverse Proxy]
        end

        subgraph "API Tier"
            B[Node.js Backend<br/>Port 5000]
            PM[Prometheus Metrics<br/>Port 9100]
        end

        subgraph "Monitoring Stack"
            P[Prometheus<br/>Port 9090]
            NE[Node Exporter<br/>Port 9100]
            CA[cAdvisor<br/>Port 8080]
        end

        subgraph "Visualization"
            G[Grafana<br/>Port 3000]
        end

        subgraph "Alerting"
            AM[Alertmanager<br/>Port 9093]
        end

        subgraph "Automation"
            PY[Python Engine<br/>Daemon Mode]
        end

        subgraph "Storage"
            PV[(Prometheus<br/>Volume)]
            GV[(Grafana<br/>Volume)]
        end
    end

    U -->|HTTP :80| F
    F -->|API Calls :5000| B
    N --> B

    B -->|Scrape| P
    B -->|Send Alerts| AM

    P -->|Scrape :9100| NE
    P -->|Scrape :8080| CA
    P -->|Scrape :5000/metrics| PM
    P --> PV

    G -->|Data Source| P
    G --> GV

    P -->|Alert Rules| AM

    AM -->|Webhook| B
    AM -->|Slack/Email| U

    PY -->|Health Check| B
    PY -->|Remediation Actions| B
    PY -->|Cleanup| NE
```

## Data Flow

1. **Metrics Collection**
   - Node Exporter collects OS-level metrics (CPU, memory, disk, network)
   - cAdvisor collects container-level metrics
   - Backend exposes custom application metrics
   - Prometheus scrapes all targets at configurable intervals

2. **Visualization**
   - Grafana queries Prometheus as data source
   - Pre-configured dashboards display real-time metrics
   - Historical data available for trend analysis

3. **Alert Processing**
   - Prometheus evaluates alert rules against collected metrics
   - Firing alerts are sent to Alertmanager
   - Alertmanager routes alerts based on severity and configuration
   - Alerts are sent to webhook endpoint (backend API) and notification channels

4. **Automated Response**
   - Python engine continuously monitors backend health
   - Threshold violations trigger automated remediation
   - Remediation actions are logged and reported

## Container Interactions

| Source | Target | Port | Protocol | Purpose |
|--------|--------|------|----------|---------|
| User | Frontend | 80 | HTTP | Web dashboard |
| Frontend | Backend | 5000 | HTTP | REST API calls |
| Prometheus | Node Exporter | 9100 | HTTP | Metrics scraping |
| Prometheus | cAdvisor | 8080 | HTTP | Container metrics |
| Prometheus | Backend | 5000 | HTTP | App metrics |
| Grafana | Prometheus | 9090 | HTTP | Data source queries |
| Prometheus | Alertmanager | 9093 | HTTP | Alert notifications |
| Alertmanager | Backend | 5000 | HTTP | Webhook alerts |
| Automation | Backend | 5000 | HTTP | Health checks + alerts |
