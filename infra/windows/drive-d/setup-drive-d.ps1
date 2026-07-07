$ErrorActionPreference = "Stop"

$Root = "D:\SIRINX_OS"
$Folders = @(
  "$Root\sirinx-co",
  "$Root\mirrors",
  "$Root\backups",
  "$Root\logs",
  "$Root\handoff"
)

foreach ($Folder in $Folders) {
  New-Item -ItemType Directory -Force -Path $Folder | Out-Null
}

Write-Host "SIRINX OS Windows Drive D folders are ready at $Root"
