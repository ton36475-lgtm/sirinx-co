param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$OutputDir = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path "artifacts\source-snapshots"),
  [string]$Stamp = (Get-Date -Format "yyyyMMdd-HHmmss")
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression.FileSystem

$stagingDir = Join-Path ([System.IO.Path]::GetTempPath()) "sirinx-source-$Stamp"
$zipPath = Join-Path $OutputDir "SIRINX_SOURCE_SNAPSHOT_$Stamp.zip"

$excludePatterns = @(
  '^[\\/]?\.git([\\/]|$)',
  '^[\\/]?node_modules([\\/]|$)',
  '^[\\/]?dist([\\/]|$)',
  '^[\\/]?04_deployment_bundle([\\/]|$)',
  '^[\\/]?artifacts([\\/]|$)',
  '^[\\/]?secrets([\\/]|$)',
  '^[\\/]?__pycache__([\\/]|$)',
  '^[\\/]?\.cache([\\/]|$)',
  '\.env$',
  '\.pem$',
  '\.key$',
  '\.p12$',
  '\.pfx$'
)

function Test-Excluded {
  param([string]$RelativePath)

  foreach ($pattern in $excludePatterns) {
    if ($RelativePath -match $pattern) {
      return $true
    }
  }

  return $false
}

if (Test-Path -LiteralPath $stagingDir) {
  Remove-Item -LiteralPath $stagingDir -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $stagingDir | Out-Null
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

Get-ChildItem -LiteralPath $Root -Recurse -File | ForEach-Object {
  $relative = $_.FullName.Substring($Root.Length).TrimStart("\", "/")
  if (Test-Excluded $relative) {
    return
  }

  $destination = Join-Path $stagingDir $relative
  $destinationParent = Split-Path -Parent $destination
  New-Item -ItemType Directory -Force -Path $destinationParent | Out-Null
  Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
}

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

[System.IO.Compression.ZipFile]::CreateFromDirectory($stagingDir, $zipPath)

$hash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash
$fileCount = (Get-ChildItem -LiteralPath $stagingDir -Recurse -File).Count

Remove-Item -LiteralPath $stagingDir -Recurse -Force

[pscustomobject]@{
  zipPath = $zipPath
  sha256 = $hash
  fileCount = $fileCount
  sourceRoot = $Root
} | ConvertTo-Json -Depth 3
