# Add Enigma to PowerShell profile
$profilePath = $PROFILE.CurrentUserAllHosts
$profileDir = Split-Path -Parent $profilePath

if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

if (-not (Test-Path $profilePath)) {
    New-Item -ItemType File -Path $profilePath -Force | Out-Null
}

$enigmaPath = "c:\dev\ENIGMA\pplx-pro-cli\bin\enigma.ps1"
$functionDef = @"

# Perplexity - Enigma CLI
function enigma {
    & "$enigmaPath" @args
}

"@

$content = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
if ($content -and $content.Contains("Perplexity - Enigma CLI")) {
    Write-Host "Enigma already in profile" -ForegroundColor Yellow
} else {
    Add-Content -Path $profilePath -Value $functionDef
    Write-Host "Added enigma to profile: $profilePath" -ForegroundColor Green
    Write-Host "Restart PowerShell or run: . `$PROFILE" -ForegroundColor Cyan
}
