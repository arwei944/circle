$db = Join-Path $PSScriptRoot '..\data\circle.db'
$dir = Split-Path $db
if (-not (Test-Path $db)) { Write-Host "no db: $db"; exit 0 }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item $db (Join-Path $dir "circle-$stamp.db")
# 清理，保留最近 7 份
Get-ChildItem $dir -Filter 'circle-*.db' | Sort-Object Name -Descending | Select-Object -Skip 7 | Remove-Item -Force
Write-Host "backup done: circle-$stamp.db"