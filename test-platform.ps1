param(
  [string]$BaseUrl = "http://localhost",
  [string]$ApiUrl = "http://localhost:5000",
  [switch]$Quiet
)

$passed = 0
$failed = 0
$TestAlertId = $null
$TestIncidentId = $null

function Ok { param([string]$Msg) if (-not $Quiet) { Write-Host "[PASS] $Msg" } $script:passed++; return $true }
function Fail { param([string]$Msg) if (-not $Quiet) { Write-Host "[FAIL] $Msg" } $script:failed++; return $false }

function Run {
  param([string]$Name, [scriptblock]$Block)
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    & $Block | Out-Null
    $sw.Stop()
    if (-not $Quiet) { Write-Host "  OK ($($sw.Elapsed.TotalSeconds.ToString('0.1'))s) " -NoNewline; Write-Host $Name -ForegroundColor Green }
    $script:passed++
  } catch {
    $sw.Stop()
    if (-not $Quiet) { Write-Host "  FAIL ($($sw.Elapsed.TotalSeconds.ToString('0.1'))s) " -NoNewline; Write-Host $Name -ForegroundColor Red; Write-Host "       $_" -ForegroundColor DarkRed }
    $script:failed++
  }
}

function HttpGet {
  param([string]$Url)
  $tmpResp = "$env:TEMP\_test_response_$([System.IO.Path]::GetRandomFileName())"
  try {
    $status = curl.exe -s -o "$tmpResp" -w "%{http_code}\n" $Url 2>$null
    if (-not $?) { return $null }
    $body = Get-Content -Path $tmpResp -Raw -ErrorAction SilentlyContinue
    return @{ status = $status.Trim(); body = $body }
  } finally { Remove-Item -Path $tmpResp -ErrorAction SilentlyContinue }
}

function HttpPost {
  param([string]$Url, [string]$Data)
  $tmpData = "$env:TEMP\_test_data_$([System.IO.Path]::GetRandomFileName()).json"
  $tmpResp = "$env:TEMP\_test_response_$([System.IO.Path]::GetRandomFileName())"
  try {
    Set-Content -Path $tmpData -Value $Data -Encoding ASCII -NoNewline
    $status = curl.exe -s -X POST -d "@$tmpData" -H "Content-Type: application/json" -o "$tmpResp" -w "%{http_code}\n" $Url 2>$null
    if (-not $?) { return $null }
    $body = Get-Content -Path $tmpResp -Raw -ErrorAction SilentlyContinue
    return @{ status = $status.Trim(); body = $body }
  } finally { Remove-Item -Path $tmpData -ErrorAction SilentlyContinue; Remove-Item -Path $tmpResp -ErrorAction SilentlyContinue }
}

function HttpPut {
  param([string]$Url)
  $tmpResp = "$env:TEMP\_test_response_$([System.IO.Path]::GetRandomFileName())"
  try {
    $status = curl.exe -s -X PUT -o "$tmpResp" -w "%{http_code}\n" $Url 2>$null
    if (-not $?) { return $null }
    $body = Get-Content -Path $tmpResp -Raw -ErrorAction SilentlyContinue
    return @{ status = $status.Trim(); body = $body }
  } finally { Remove-Item -Path $tmpResp -ErrorAction SilentlyContinue }
}

if (-not $Quiet) {
  Write-Host "==================================================" -ForegroundColor Cyan
  Write-Host "  CloudInfra Platform - Feature Test Suite" -ForegroundColor Cyan
  Write-Host "==================================================" -ForegroundColor Cyan
  Write-Host ""
}

# ── 1. Container checks ──
Run -Name "All 7 containers are running" {
  $ps = docker compose ps --format json 2>$null | ConvertFrom-Json
  if (-not $ps) { throw "docker compose ps failed" }
  $running = ($ps | Where-Object { $_.State -eq "running" }).Count
  $total = $ps.Count
  if ($running -ne $total) { throw "Only $running/$total containers running" }
}

# ── 2. Frontend ──
Run -Name "Frontend loads" {
  $r = HttpGet "$BaseUrl/"
  if (-not $r -or $r.status -ne "200") { throw "HTTP $($r.status)" }
  if ($r.body -notmatch "CloudInfra") { throw "Missing 'CloudInfra' text" }
}

Run -Name "Dashboard page has HTML title" {
  $r = HttpGet "$BaseUrl/"
  if ($r.body -notmatch "CloudInfra Monitor") { throw "Missing HTML page title" }
}

Run -Name "Alerts page loads" { $r = HttpGet "$BaseUrl/alerts"; if ($r.status -ne "200") { throw "HTTP $($r.status)" } }
Run -Name "Incidents page loads" { $r = HttpGet "$BaseUrl/incidents"; if ($r.status -ne "200") { throw "HTTP $($r.status)" } }
Run -Name "System Health page loads" { $r = HttpGet "$BaseUrl/health"; if ($r.status -ne "200") { throw "HTTP $($r.status)" } }
Run -Name "Remediation page loads" { $r = HttpGet "$BaseUrl/remediation"; if ($r.status -ne "200") { throw "HTTP $($r.status)" } }

# ── 3. Backend API ──
Run -Name "Backend health endpoint" {
  $r = HttpGet "$ApiUrl/api/health"
  if ($r.status -ne "200") { throw "HTTP $($r.status)" }
  if ($r.body -notmatch "healthy") { throw "Not healthy" }
}

Run -Name "System status returns full metrics" {
  $r = HttpGet "$ApiUrl/api/status"
  if ($r.status -ne "200") { throw "HTTP $($r.status)" }
  $m = $r.body | ConvertFrom-Json
  if (-not $m.metrics.cpu) { throw "Missing CPU" }
  if (-not $m.metrics.memory) { throw "Missing memory" }
  if ($m.metrics.disk.Count -lt 1) { throw "No disk data" }
  if (-not $m.metrics.uptime) { throw "Missing uptime" }
}

Run -Name "CPU metrics" { $r = HttpGet "$ApiUrl/api/metrics/cpu"; $m = $r.body | ConvertFrom-Json; if ($m.cpu -eq $null) { throw "No CPU value" } }
Run -Name "Memory metrics" { $r = HttpGet "$ApiUrl/api/metrics/memory"; $m = $r.body | ConvertFrom-Json; if ($m.memory -eq $null) { throw "No memory value" } }
Run -Name "Disk metrics" { $r = HttpGet "$ApiUrl/api/metrics/disk"; $m = $r.body | ConvertFrom-Json; if ($m.disk.Count -lt 1) { throw "No disk data" } }
Run -Name "Network metrics" { $r = HttpGet "$ApiUrl/api/metrics/network"; $m = $r.body | ConvertFrom-Json; if ($m.network.Count -lt 1) { throw "No network data" } }
Run -Name "Uptime metrics" { $r = HttpGet "$ApiUrl/api/metrics/uptime"; $m = $r.body | ConvertFrom-Json; if ($m.uptime -le 0) { throw "Invalid uptime" } }

# ── 4. Prometheus /metrics ──
Run -Name "Prometheus metrics expose all 5 families" {
  $r = HttpGet "$ApiUrl/metrics"
  if ($r.status -ne "200") { throw "HTTP $($r.status)" }
  $expected = "system_cpu_usage_percent", "system_memory_usage_percent", "system_disk_usage_percent", "system_uptime_seconds", "alerts_active_total"
  foreach ($m in $expected) { if ($r.body -notmatch $m) { throw "Missing metric: $m" } }
}

# ── 5. Alert CRUD ──
Run -Name "Create alert" {
  $r = HttpPost "$ApiUrl/api/alerts" '{"type":"test","severity":"critical","message":"Test alert from test suite","source":"test-script"}'
  if ($r.status -ne "201") { throw "HTTP $($r.status)" }
  $global:TestAlertId = ($r.body | ConvertFrom-Json).id
  if (-not $global:TestAlertId) { throw "No ID returned" }
}

Run -Name "Alert appears in list with status=active" {
  $r = HttpGet "$ApiUrl/api/alerts"
  $all = $r.body | ConvertFrom-Json
  $a = $all | Where-Object { $_ -and $_.id -eq $global:TestAlertId }
  if (-not $a) { throw "Alert not found" }
  $s = if ($a -is [array]) { $a[0].status } else { $a.status }
  if ($s -ne "active") { throw "Expected active, got '$s'" }
}

Run -Name "Acknowledge alert" {
  $r = HttpPut "$ApiUrl/api/alerts/$global:TestAlertId/acknowledge"
  if ($r.status -ne "200") { throw "HTTP $($r.status)" }
  $b = $r.body | ConvertFrom-Json
  if ($b.status -ne "acknowledged") { throw "Expected acknowledged, got $($b.status)" }
}

Run -Name "Resolve alert" {
  $r = HttpPut "$ApiUrl/api/alerts/$global:TestAlertId/resolve"
  if ($r.status -ne "200") { throw "HTTP $($r.status)" }
  $b = $r.body | ConvertFrom-Json
  if ($b.status -ne "resolved") { throw "Expected resolved, got $($b.status)" }
}

# ── 6. Incident CRUD ──
Run -Name "Create incident" {
  $r = HttpPost "$ApiUrl/api/alerts/incidents" '{"title":"Test incident","severity":"high","description":"Automated test","source":"test-script","affectedService":"backend"}'
  if ($r.status -ne "201") { throw "HTTP $($r.status)" }
  $global:TestIncidentId = ($r.body | ConvertFrom-Json).id
  if (-not $global:TestIncidentId) { throw "No ID returned" }
}

Run -Name "Incident appears in list" {
  $r = HttpGet "$ApiUrl/api/alerts/incidents"
  $i = $r.body | ConvertFrom-Json | Where-Object { $_.id -eq $global:TestIncidentId }
  if (-not $i) { throw "Incident not found" }
}

Run -Name "Resolve incident" {
  $r = HttpPut "$ApiUrl/api/alerts/incidents/$global:TestIncidentId/resolve"
  if ($r.status -ne "200") { throw "HTTP $($r.status)" }
  $b = $r.body | ConvertFrom-Json
  if ($b.status -ne "resolved") { throw "Expected resolved, got $($b.status)" }
}

# ── 7. Stats ──
Run -Name "Alert stats endpoint" {
  $r = HttpGet "$ApiUrl/api/alerts/stats"
  if ($r.status -ne "200") { throw "HTTP $($r.status)" }
  $s = $r.body | ConvertFrom-Json
  if ($s.totalAlerts -eq $null -or $s.activeAlerts -eq $null) { throw "Missing stat fields" }
}

# ── 8. External services ──
Run -Name "Grafana responds" { $r = HttpGet "http://localhost:3000"; if ($r.status -ne "302" -and $r.status -ne "200") { throw "HTTP $($r.status)" } }
Run -Name "Prometheus UI responds" { $r = HttpGet "http://localhost:9090"; if ($r.status -ne "302" -and $r.status -ne "200") { throw "HTTP $($r.status)" } }
Run -Name "Alertmanager responds" { $r = HttpGet "http://localhost:9093"; if ($r.status -ne "200") { throw "HTTP $($r.status)" } }
Run -Name "Node Exporter responds" { $r = HttpGet "http://localhost:9100"; if ($r.status -ne "200") { throw "HTTP $($r.status)" } }

# ── 9. Automation ──
Run -Name "Automation container has recent logs" {
  $logs = docker compose logs automation --tail 5 2>$null
  if (-not $logs) { throw "No logs from automation" }
}

# ── Summary ──
$total = $passed + $failed
if (-not $Quiet) {
  Write-Host ""
  if ($failed -eq 0) {
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "  Result: $passed/$total tests PASSED" -ForegroundColor Green
    Write-Host "  All systems operational." -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
  } else {
    Write-Host "==================================================" -ForegroundColor Red
    Write-Host "  Result: $passed/$total passed, $failed failed" -ForegroundColor Red
    Write-Host "==================================================" -ForegroundColor Red
  }
}

if ($failed -gt 0) { exit 1 } else { exit 0 }
