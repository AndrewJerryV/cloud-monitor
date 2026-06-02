FROM python:3.11-slim
WORKDIR /app
COPY . .
ENV PYTHONPATH=/app/vendor
CMD ["python", "-m", "scripts.remediation_engine", "--mode", "daemon", "--interval", "30"]
