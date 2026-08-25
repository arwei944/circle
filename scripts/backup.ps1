$db = Join-Path $PSScriptRoot '..\data\circle.db'
$dir = Split-Path $db
if (-not (Test-Path $db)) { Write-Host "no db: $db"; exit 0 }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$out = Join-Path $dir "circle-$stamp.db"
node -e "const D=require('better-sqlite3');const d=new D(process.argv[1]);const q='\'' + process.argv[2].replace(/'/g,'\'\'') + '\'';d.prepare('VACUUM INTO '+q).run();d.close();" "$db" "$out"
if (-not (Test-Path $out)) { Write-Host "backup failed"; exit 1 }
# 清理，保留最近 7 份（当前快照永不清理）
$stale = @(Get-ChildItem $dir -Filter 'circle-*.db' | Where-Object { [IO.Path]::GetFullPath($_.FullName) -ne [IO.Path]::GetFullPath($out) } | Sort-Object Name -Descending | Select-Object -Skip 7)
foreach ($f in $stale) { Remove-Item -LiteralPath $f.FullName -Force }
Write-Host "backup done: circle-$stamp.db"