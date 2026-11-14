param(
    [int]$Port = 5230,
    [string]$DataDir = "D:\qa-projects\memos\data"
)

$exe = "D:\qa-projects\memos\memos.exe"
if (-not (Test-Path $exe)) { throw "memos.exe not found: $exe" }

& $exe --port $Port --data $DataDir --log-level warn
