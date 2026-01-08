# Create Desktop Shortcut for Perplexity - Enigma
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnigmaPath = Join-Path $ScriptDir "bin" "enigma.ps1"
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Enigma.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Target is PowerShell running the enigma wrapper
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoExit -ExecutionPolicy Bypass -Command `"& '$EnigmaPath'`""
$Shortcut.WorkingDirectory = $ScriptDir
$Shortcut.Description = "Perplexity - Enigma: AI-Powered Coding Assistant"
$Shortcut.Save()

Write-Host "Desktop shortcut created: $ShortcutPath" -ForegroundColor Green
Write-Host "Working directory: $ScriptDir" -ForegroundColor Cyan
