# Reel Pack installer (Windows PowerShell).
#   powershell -ExecutionPolicy Bypass -File install.ps1                 set up the pack in this folder
#   powershell -ExecutionPolicy Bypass -File install.ps1 C:\path\folder  copy the pack into another folder and set it up there
param([string]$Dest = "")
$ErrorActionPreference = "Stop"
$Src = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($Dest -eq "") { $Dest = $Src }

function Test-Need($cmd, $hint) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { Write-Host "Missing: $cmd. $hint"; exit 1 }
}
Test-Need "node" "Install Node.js 18+ from https://nodejs.org"
Test-Need "npm" "Install Node.js 18+ from https://nodejs.org"
Test-Need "ffmpeg" "Install ffmpeg: winget install Gyan.FFmpeg (then open a new terminal)"

if ((Resolve-Path $Src).Path -ne [IO.Path]::GetFullPath($Dest)) {
  New-Item -ItemType Directory -Force $Dest | Out-Null
  foreach ($item in @("CLAUDE.md", "README.md", "LICENSE", "THIRD-PARTY-NOTICES.md", ".claude", "knowledge", "tools", "projects")) {
    $target = Join-Path $Dest $item
    if ($item -eq "CLAUDE.md" -and (Test-Path $target)) {
      Write-Host "Note: CLAUDE.md exists in $Dest; writing the pack's version to CLAUDE.reel-pack.md (merge it in yourself)."
      Copy-Item (Join-Path $Src "CLAUDE.md") (Join-Path $Dest "CLAUDE.reel-pack.md")
      continue
    }
    Copy-Item (Join-Path $Src $item) $Dest -Recurse -Force
  }
  $kitDest = Join-Path $Dest "kit"
  New-Item -ItemType Directory -Force $kitDest | Out-Null
  Get-ChildItem (Join-Path $Src "kit") -Force | Where-Object { $_.Name -notin @("node_modules", "out") } | ForEach-Object {
    Copy-Item $_.FullName $kitDest -Recurse -Force
  }
  Write-Host "Copied the pack into $Dest"
}

Write-Host "Installing the kit (Remotion + three.js). First time takes a minute or two..."
Push-Location (Join-Path $Dest "kit")
npm install --no-audit --no-fund
Pop-Location

$py = Get-Command python -ErrorAction SilentlyContinue
if ($py) {
  & python -c "import numpy" 2>$null
  if ($LASTEXITCODE -eq 0) {
    & python (Join-Path $Dest "tools\make_sfx.py") (Join-Path $Dest "kit\public\sfx") | Out-Null
    Write-Host "SFX library ready."
  } else { Write-Host "Optional: pip install -r tools\requirements.txt (check tools + SFX synth). Starter SFX are already included." }
} else { Write-Host "Optional: install Python 3.10+ and run: pip install -r tools\requirements.txt (check tools)." }

Write-Host ""
Write-Host "Done. Open Claude Code in: $Dest"
Write-Host "Then try:  make a 6-second 9:16 animation of a tank firing, using the reel pack"
Write-Host "       or:  make a 10-second myth-style scene: a man drops a bowling ball and a feather. Which lands first?"
