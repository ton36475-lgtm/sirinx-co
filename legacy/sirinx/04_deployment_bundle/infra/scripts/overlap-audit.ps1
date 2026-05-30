param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

$ErrorActionPreference = "Stop"

$requiredDocs = @(
  "governance/CANONICAL_OPERATING_SYSTEM.md",
  "governance/SIRINX_FINAL_ARCHITECTURE_BLUEPRINT.md",
  "governance/REPO_CONSOLIDATION_MATRIX.md",
  "governance/FIELD_VALIDATED_HARDWARE_CONTEXT.md",
  "knowledge/shadow-vault/HARDWARE_TELEMETRY_PROTOCOL.md",
  "docs/migration/SERVER_HANDOFF_FINAL.md",
  "docs/migration/WORKSPACE_PROJECT_CONSOLIDATION_MAP.md"
)

$runtimeDirs = @("client", "server", "shared", "brands")
$forbiddenPattern = "CHOKMA|chokma|deejai789|casino|gambling|lottery|baccarat|บาคาร่า|พนัน|หวย"
$runtimeHits = @()

foreach ($dir in $runtimeDirs) {
  $path = Join-Path $Root $dir
  if (-not (Test-Path -LiteralPath $path)) {
    continue
  }

  $files = Get-ChildItem -LiteralPath $path -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object {
      $_.FullName -notmatch "\\(node_modules|dist|artifacts|\.git)\\" -and
      $_.Extension -ne ".md" -and
      $_.Name -ne "AGENTS.md"
    }

  foreach ($file in $files) {
    $matches = Select-String -LiteralPath $file.FullName -Pattern $forbiddenPattern -ErrorAction SilentlyContinue
    foreach ($match in $matches) {
      $runtimeHits += [pscustomobject]@{
        path = $match.Path
        line = $match.LineNumber
        text = $match.Line.Trim()
      }
    }
  }
}

$missingDocs = @()
foreach ($doc in $requiredDocs) {
  if (-not (Test-Path -LiteralPath (Join-Path $Root $doc))) {
    $missingDocs += $doc
  }
}

$composePath = Join-Path $Root "docker-compose.yml"
$composeText = ""
if (Test-Path -LiteralPath $composePath) {
  $composeText = Get-Content -LiteralPath $composePath -Raw
}

$publicServiceCount = ([regex]::Matches($composeText, "(?m)^\s{2}sirinx-public:\s*$")).Count
$publicPortCount = ([regex]::Matches($composeText, '"3000:3000"')).Count
$privateDbExposure = $composeText -match '"5432:5432"|''5432:5432''|"6379:6379"|''6379:6379'''

$result = [pscustomobject]@{
  root = $Root
  decision = "PASS"
  missingRequiredDocs = $missingDocs
  runtimeForbiddenHits = $runtimeHits.Count
  runtimeForbiddenHitSample = $runtimeHits | Select-Object -First 20
  serviceOwnership = [pscustomobject]@{
    sirinxPublicServiceCount = $publicServiceCount
    hostPort3000MappingCount = $publicPortCount
    privateDbOrRedisExposed = [bool]$privateDbExposure
  }
}

if ($missingDocs.Count -gt 0 -or $runtimeHits.Count -gt 0 -or $publicServiceCount -ne 1 -or $publicPortCount -ne 1 -or $privateDbExposure) {
  $result.decision = "FAIL"
}

$result | ConvertTo-Json -Depth 6

if ($result.decision -ne "PASS") {
  exit 1
}
