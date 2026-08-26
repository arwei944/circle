# Opens Circle in a standalone app window (no url bar / tabs),
# using a dedicated Chrome profile. Used by circle-launch.vbs.
#
# Polls http://localhost:3100 until the server responds (fast 250ms
# interval), then opens the app window. When ensure-server.ps1 already
# warmed the server this resolves on the first attempt (~instant).

$ErrorActionPreference = 'Stop'

$url = 'http://localhost:3100/zh/lndev-ui/team/CORE/all'

# wait for the server (250ms interval, up to ~30s)
$ready = $false
for ($i = 0; $i -lt 120; $i++) {
   try {
      $r = Invoke-WebRequest -Uri 'http://localhost:3100' -UseBasicParsing -TimeoutSec 1 -MaximumRedirection 5
      if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) {
         $ready = $true
         break
      }
   } catch {
      # server not ready yet
   }
   Start-Sleep -Milliseconds 250
}

if (-not $ready) {
   Start-Sleep -Seconds 1
}

$profileDir = Join-Path $env:LOCALAPPDATA 'CircleApp\chrome-profile'

$candidates = @(
   'C:\Program Files\Google\Chrome\Application\chrome.exe',
   'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
   'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
   'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
)

$browser = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($browser) {
   Start-Process -FilePath $browser -ArgumentList @(
      "--user-data-dir=$profileDir",
      "--no-first-run",
      "--no-default-browser-check",
      "--app=$url"
   )
} else {
   Start-Process $url
}