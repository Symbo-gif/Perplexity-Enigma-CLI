# Create Desktop Shortcut for Perplexity - Enigma
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Enigma.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Target is PowerShell running the enigma wrapper
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoExit -ExecutionPolicy Bypass -Command `"& 'c:\dev\ENIGMA\pplx-pro-cli\bin\enigma.ps1'`""
$Shortcut.WorkingDirectory = "c:\dev\ENIGMA"
$Shortcut.IconLocation = "c:\dev\ENIGMA\Gemini_Generated_Image_nieb69nieb69nieb.ico"
$Shortcut.Description = "Perplexity - Enigma: AI-Powered Coding Assistant"
$Shortcut.Save()

Write-Host "Desktop shortcut created: $ShortcutPath" -ForegroundColor Green
Write-Host "Icon: c:\dev\ENIGMA\Gemini_Generated_Image_nieb69nieb69nieb.ico" -ForegroundColor Cyan
