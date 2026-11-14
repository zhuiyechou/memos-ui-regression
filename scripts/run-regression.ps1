param(
    [string]$Url = "http://127.0.0.1:5230",
    [switch]$NoStartServer,
    [int]$KeepRuns = 14
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$reportRoot = Join-Path $root "reports"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$runDir = Join-Path $reportRoot $stamp
$logFile = Join-Path $reportRoot "last-run.log"
$jsonFile = Join-Path $runDir "results.json"
$htmlDir = Join-Path $runDir "html"

New-Item -ItemType Directory -Force -Path $runDir | Out-Null
Set-Content -Path $logFile -Value ""

function Write-Log([string]$Message) {
    $line = "[{0}] {1}" -f (Get-Date -Format "HH:mm:ss"), $Message
    Write-Host $line
    Add-Content -Path $logFile -Value $line
}

function Test-Memos {
    try {
        return (Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200
    } catch {
        return $false
    }
}

if (-not (Test-Memos)) {
    if ($NoStartServer) {
        Write-Log "Memos is not reachable at $Url and -NoStartServer was set. Abort."
        exit 2
    }
    Write-Log "Memos is down, starting memos.exe ..."
    $exe = "D:\qa-projects\memos\memos.exe"
    if (-not (Test-Path $exe)) { Write-Log "memos.exe not found: $exe"; exit 2 }
    Start-Process -FilePath $exe `
        -ArgumentList "--port", "5230", "--data", "D:\qa-projects\memos\data", "--log-level", "warn" `
        -WindowStyle Hidden | Out-Null
    $deadline = (Get-Date).AddSeconds(60)
    while ((Get-Date) -lt $deadline -and -not (Test-Memos)) { Start-Sleep -Seconds 2 }
    if (-not (Test-Memos)) { Write-Log "Memos did not become ready within 60s. Abort."; exit 2 }
    Write-Log "Memos is ready."
}

if (-not $env:PLAYWRIGHT_BROWSERS_PATH) { $env:PLAYWRIGHT_BROWSERS_PATH = "D:\ms-playwright" }
$env:PLAYWRIGHT_JSON_OUTPUT_NAME = $jsonFile

Write-Log "Running Playwright regression (64 cases + 1 setup) ..."
& npx.cmd playwright test --reporter=list --reporter=html --reporter=json
$exitCode = $LASTEXITCODE

if (Test-Path "playwright-report") {
    New-Item -ItemType Directory -Force -Path $htmlDir | Out-Null
    Copy-Item -Path "playwright-report\*" -Destination $htmlDir -Recurse -Force
    Write-Log "HTML report archived: $htmlDir\index.html"
}

$summary = "no JSON report"
if (Test-Path $jsonFile) {
    $summary = & node -e "const s=require(process.argv[1]).stats; console.log('expected='+s.expected+' unexpected='+s.unexpected+' flaky='+s.flaky+' skipped='+s.skipped)" $jsonFile
    Write-Log "Stats: $summary"
}

if (Test-Memos) {
    Write-Log "Cleaning up E2E- data ..."
    & node scripts/cleanup-e2e.mjs *> $null
    if ($LASTEXITCODE -eq 0) { Write-Log "Cleanup done." } else { Write-Log "Cleanup exited with $LASTEXITCODE." }
}

$runs = Get-ChildItem -Path $reportRoot -Directory |
    Where-Object { $_.Name -match '^\d{8}-\d{6}$' } |
    Sort-Object Name -Descending
if ($runs.Count -gt $KeepRuns) {
    $runs | Select-Object -Skip $KeepRuns | ForEach-Object {
        Remove-Item -Path $_.FullName -Recurse -Force
        Write-Log "Removed old report: $($_.Name)"
    }
}

Write-Log "Regression finished with exit code $exitCode ($summary)"
exit $exitCode
