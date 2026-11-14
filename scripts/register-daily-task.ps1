param(
    [string]$TaskName = "MemosUIRegression",
    [string]$Time = "09:30"
)

$scriptPath = Join-Path $PSScriptRoot "run-regression.ps1"
if (-not (Test-Path $scriptPath)) { throw "run-regression.ps1 not found: $scriptPath" }

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At $Time
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -MultipleInstances IgnoreNew

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Daily Memos UI regression (Playwright, 64 cases / 65 executions)" `
    -Force | Out-Null

Write-Host "Registered daily task '$TaskName' at $Time."
Write-Host "Log: D:\qa-projects\memos-ui-regression\reports\last-run.log"
Write-Host "Remove with: Unregister-ScheduledTask -TaskName '$TaskName'"
