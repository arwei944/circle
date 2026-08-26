# Hidden server starter for Circle (no console window).
# - if port 3100 is already listening, exits immediately (server is warm).
# - otherwise builds if needed and starts `pnpm start --port 3100` hidden.

$ErrorActionPreference = 'SilentlyContinue'
$root = 'C:\work\test\circle'
$logDir = Join-Path $env:TEMP 'circle-app'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$out = Join-Path $logDir 'server.out.log'
$err = Join-Path $logDir 'server.err.log'

$inUse = [bool](Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue)
if ($inUse) {
   exit 0
}

Set-Location $root

if (-not (Test-Path (Join-Path $root '.next\BUILD_ID'))) {
   Remove-Item $out, $err -ErrorAction SilentlyContinue
   & 'C:\Program Files\nodejs\pnpm.cmd' build 1>> $out 2>> $err
   if ($LASTEXITCODE -ne 0) { exit 1 }
}

Remove-Item $out, $err -ErrorAction SilentlyContinue
Start-Process -FilePath 'C:\Program Files\nodejs\pnpm.cmd' `
   -ArgumentList 'start', '--port', '3100' `
   -WorkingDirectory $root `
   -WindowStyle Hidden `
   -RedirectStandardOutput $out `
   -RedirectStandardError $err | Out-Null
exit 0