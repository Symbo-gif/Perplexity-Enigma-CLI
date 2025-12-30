$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path $ScriptDir -Parent
$EntryPoint = Join-Path $ProjectRoot "dist" "index.js"

if (-not (Test-Path $EntryPoint)) {
    Write-Host "Build artifacts not found. Run 'npm run build' first." -ForegroundColor Red
    exit 1
}

node $EntryPoint @args
