<#
.SYNOPSIS
    Setup script for Perplexity - Enigma CLI

.DESCRIPTION
    Installs dependencies, builds the project, and configures your system
    so you can run 'enigma' from anywhere in PowerShell.

.EXAMPLE
    .\setup.ps1
    # Run the full setup

.EXAMPLE
    .\setup.ps1 -SkipBuild
    # Skip the build step (if already built)
#>

[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Step {
    param([string]$Message)
    Write-Host "[*] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[+] $Message" -ForegroundColor Green
}

function Write-Err {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor Red
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor Yellow
}

function Show-Banner {
    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "              Perplexity - Enigma Setup" -ForegroundColor Magenta
    Write-Host "         Enterprise AI-Powered Coding Assistant" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-NodeInstalled {
    try {
        $nodeVersion = & node --version 2>$null
        if ($nodeVersion -match "v(\d+)") {
            $majorVersion = [int]$Matches[1]
            if ($majorVersion -ge 18) {
                return $true
            }
            Write-Err "Node.js 18+ is required. Found: $nodeVersion"
            return $false
        }
    }
    catch {
        Write-Err "Node.js is not installed or not in PATH"
        Write-Host "Please install Node.js 18+ from https://nodejs.org"
        return $false
    }
    return $false
}

function Install-Dependencies {
    Write-Step "Installing npm dependencies..."
    Push-Location $ScriptDir
    try {
        $output = & npm install 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host $output
            throw "npm install failed"
        }
        Write-Success "Dependencies installed"
    }
    finally {
        Pop-Location
    }
}

function Build-Project {
    Write-Step "Building TypeScript project..."
    Push-Location $ScriptDir
    try {
        $output = & npm run build 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host $output
            throw "Build failed"
        }
        Write-Success "Build completed"
    }
    finally {
        Pop-Location
    }
}

function Get-ProfilePath {
    return $PROFILE.CurrentUserAllHosts
}

function Add-EnigmaToProfile {
    $profilePath = Get-ProfilePath
    $profileDir = Split-Path -Parent $profilePath

    # Ensure profile directory exists
    if (-not (Test-Path $profileDir)) {
        New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    }

    # Create profile if it doesn't exist
    if (-not (Test-Path $profilePath)) {
        New-Item -ItemType File -Path $profilePath -Force | Out-Null
        Write-Step "Created PowerShell profile at $profilePath"
    }

    $enigmaPath = Join-Path $ScriptDir "bin" "enigma.ps1"

    # Check if already added
    if (Test-Path $profilePath) {
        $profileContent = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
    }
    else {
        $profileContent = ""
    }
    if ($profileContent -and ($profileContent -match "function\s+enigma")) {
        Write-Warn "Enigma function already exists in your PowerShell profile. Skipping duplicate entry."
        return
    }

    # Add to profile
    $functionDef = @"

# Perplexity - Enigma CLI
function enigma {
    & "$enigmaPath" @args
}

"@
    Add-Content -Path $profilePath -Value $functionDef
    Write-Success "Added 'enigma' command to PowerShell profile"
    Write-Host "   Profile: $profilePath"
}

function Remove-EnigmaFromProfile {
    $profilePath = Get-ProfilePath

    if (-not (Test-Path $profilePath)) {
        Write-Warn "No PowerShell profile found"
        return
    }

    $profileContent = Get-Content $profilePath -Raw
    if (-not $profileContent.Contains("Perplexity - Enigma CLI")) {
        Write-Warn "Enigma is not in your PowerShell profile"
        return
    }

    # Remove the enigma function block
    $pattern = "(?s)\r?\n# Perplexity - Enigma CLI\r?\nfunction enigma \{[^}]+\}\r?\n"
    $newContent = $profileContent -replace $pattern, ""
    Set-Content -Path $profilePath -Value $newContent

    Write-Success "Removed 'enigma' command from PowerShell profile"
}

function Test-ApiKey {
    if ($env:PPLX_API_KEY) {
        Write-Success "PPLX_API_KEY environment variable is set"
        return $true
    }

    $envPath = Join-Path $ScriptDir ".env"
    if (Test-Path $envPath) {
        $content = Get-Content $envPath -Raw
        if ($content -match "PPLX_API_KEY=pplx-") {
            Write-Success "API key found in .env file"
            return $true
        }
    }

    $configPath = Join-Path $ScriptDir ".pplxrc"
    if (Test-Path $configPath) {
        $content = Get-Content $configPath -Raw
        if ($content -match "key:\s*[`"']?pplx-") {
            Write-Success "API key found in .pplxrc"
            return $true
        }
    }

    Write-Warn "No API key configured"
    Write-Host ""
    Write-Host "   To set your API key, use one of these methods:"
    Write-Host ""
    Write-Host "   1. Environment variable (recommended):"
    Write-Host '      $env:PPLX_API_KEY = "pplx-your-key-here"' -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   2. Or use the CLI to set it:"
    Write-Host '      enigma config set api.key pplx-your-key-here' -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Get your API key at: https://www.perplexity.ai/settings/api"
    Write-Host ""

    return $false
}

function Main {
    Show-Banner

    if ($Uninstall) {
        Write-Step "Uninstalling Perplexity - Enigma..."
        Remove-EnigmaFromProfile
        Write-Success "Uninstall complete. Restart PowerShell to apply changes."
        return
    }

    # Check Node.js
    Write-Step "Checking prerequisites..."
    if (-not (Test-NodeInstalled)) {
        exit 1
    }
    Write-Success "Node.js is installed"

    # Install dependencies
    if (-not (Test-Path (Join-Path $ScriptDir "node_modules"))) {
        Install-Dependencies
    }
    else {
        Write-Success "Dependencies already installed"
    }

    # Build project
    if (-not $SkipBuild) {
        if (-not (Test-Path (Join-Path $ScriptDir "dist" "index.js"))) {
            Build-Project
        }
        else {
            Write-Success "Project already built"
        }
    }

    # Add to PowerShell profile
    Write-Step "Configuring PowerShell..."
    Add-EnigmaToProfile

    # Check for API key
    Write-Step "Checking API key..."
    Test-ApiKey | Out-Null

    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "✓ Enigma CLI installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To start using Enigma:"
    Write-Host ""
    Write-Host "  1. Restart PowerShell (or run: . `$PROFILE)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  2. Run 'enigma' to get started" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Quick commands:"
    Write-Host "  enigma                    - Interactive mode" -ForegroundColor Cyan
    Write-Host '  enigma ask "question"     - Quick question' -ForegroundColor Cyan
    Write-Host "  enigma review file.ts     - Code review" -ForegroundColor Cyan
    Write-Host '  enigma research "topic"   - Deep research' -ForegroundColor Cyan
    Write-Host "  enigma --help             - Show all commands" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor Green
    Write-Host ""
}

# Run main
Main
