param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$ArtifactsDir = (Join-Path $Root "artifacts\review")
)

$ErrorActionPreference = "Stop"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$runDir = Join-Path $ArtifactsDir $stamp
New-Item -ItemType Directory -Force -Path $runDir | Out-Null
$validationDir = Join-Path $Root "artifacts\validation"
$liveHandoffDir = Join-Path $Root "artifacts\live-handoff"
$sourceSnapshotDir = Join-Path $Root "artifacts\source-snapshots"
New-Item -ItemType Directory -Force -Path $validationDir | Out-Null
New-Item -ItemType Directory -Force -Path $liveHandoffDir | Out-Null
New-Item -ItemType Directory -Force -Path $sourceSnapshotDir | Out-Null

$bashPath = "C:\Program Files\Git\bin\bash.exe"
if (-not (Test-Path -LiteralPath $bashPath -PathType Leaf)) {
  throw "Git Bash not found at $bashPath"
}

$stepResults = New-Object System.Collections.Generic.List[object]

function Invoke-NativeCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [string[]]$ArgumentList = @()
  )

  $previousPreference = $ErrorActionPreference
  $nativeExitCode = 0

  try {
    $ErrorActionPreference = "Continue"
    & $FilePath @ArgumentList 2>&1
    $nativeExitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }

  if ($nativeExitCode -ne 0) {
    throw "$FilePath exited with code $nativeExitCode"
  }
}

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  $safeName = ($Name -replace "[^A-Za-z0-9\-]", "_")
  $logPath = Join-Path $runDir "$safeName.log"
  Set-Content -LiteralPath $logPath -Value "" -Encoding UTF8

  try {
    & $Action 2>&1 | Tee-Object -FilePath $logPath | Out-Null
    [void]$stepResults.Add([pscustomobject]@{
        name = $Name
        status = "passed"
        log = $logPath
      })
  } catch {
    $_ | Out-String | Tee-Object -FilePath $logPath -Append | Out-Null
    [void]$stepResults.Add([pscustomobject]@{
        name = $Name
        status = "failed"
        log = $logPath
        message = $_.Exception.Message
      })
    throw
  }
}

function Get-TextFiles {
  param(
    [string[]]$Roots
  )

  $extensions = @(".md", ".ts", ".tsx", ".js", ".jsx", ".json", ".sh", ".ps1", ".yml", ".yaml", ".html", ".css")
  foreach ($path in $Roots) {
    $fullPath = Join-Path $Root $path
    if (-not (Test-Path -LiteralPath $fullPath)) {
      continue
    }

    Get-ChildItem -LiteralPath $fullPath -Recurse -File -ErrorAction SilentlyContinue |
      Where-Object {
        $extensions -contains $_.Extension -and
        $_.FullName -notmatch "\\(node_modules|dist|artifacts|\.git|04_deployment_bundle)\\"
      }
  }
}

function Find-PatternHits {
  param(
    [string[]]$Roots,
    [string]$Pattern,
    [int]$Limit = 20
  )

  $hits = @()
  foreach ($file in Get-TextFiles -Roots $Roots) {
    $matches = Select-String -LiteralPath $file.FullName -Pattern $Pattern -ErrorAction SilentlyContinue
    foreach ($match in $matches) {
      $hits += [pscustomobject]@{
        path = $match.Path
        line = $match.LineNumber
        text = $match.Line.Trim()
      }
      if ($hits.Count -ge $Limit) {
        return $hits
      }
    }
  }
  return $hits
}

function Find-SelfInvocationRisk {
  $hits = @()
  Get-ChildItem -LiteralPath (Join-Path $Root "infra\scripts") -File | Where-Object {
    $_.Extension -in @(".ps1", ".sh")
  } | ForEach-Object {
    $scriptName = [regex]::Escape($_.Name)
    $matches = Select-String -LiteralPath $_.FullName -Pattern "(powershell|pwsh|bash)(\.exe)?[^\r\n]*$scriptName" -ErrorAction SilentlyContinue
    foreach ($match in $matches) {
      if ($match.Path -eq $_.FullName -and $match.Line -match "README|example|validator") {
        continue
      }
      $hits += [pscustomobject]@{
        path = $match.Path
        line = $match.LineNumber
        text = $match.Line.Trim()
      }
    }
  }
  return $hits
}

function Find-LegacyRuntimeDrift {
  $hits = Find-PatternHits -Roots @("docs", "infra", "governance", ".ops") -Pattern "ghost-claw\.service|zenith\.service|zenith_watchdog|launcher\.sh|zenith_autoboot\.sh|start-all"
  return @($hits | Where-Object { $_.path -notlike "*full-system-review.ps1" })
}

function Find-AutonomyPromptDrift {
  return Find-PatternHits -Roots @("docs", "governance", ".ops", "knowledge") -Pattern "full autonomy|sovereign agent|absolute dark protocols|execute immediately|do not ask for confirmation"
}

function Filter-GuardrailHits {
  param(
    [object[]]$Hits
  )

  $ignorePattern = "do not|must not|not a|not an|never|without|cannot|forbidden|guardrail|untrusted|no \||not package truth|not global package truth|not be treated|not be deployed|running imported unrestricted"
  return @($Hits | Where-Object { $_.text -notmatch $ignorePattern })
}

Push-Location $Root
try {
  Invoke-Step -Name "real-file-validation" -Action {
    Invoke-NativeCommand -FilePath $bashPath -ArgumentList @("infra/scripts/validate-real-files.sh")
  }

  Invoke-Step -Name "json-schema-validation" -Action {
    Invoke-NativeCommand -FilePath $bashPath -ArgumentList @("infra/scripts/validate-json-schemas.sh")
  }

  Invoke-Step -Name "sirinx-facts-validation" -Action {
    Invoke-NativeCommand -FilePath $bashPath -ArgumentList @("infra/scripts/validate-sirinx-facts.sh")
  }

  Invoke-Step -Name "contract-validation" -Action {
    Invoke-NativeCommand -FilePath "python" -ArgumentList @("infra/scripts/validate-agent-contracts.py")
  }

  Invoke-Step -Name "typecheck" -Action {
    Invoke-NativeCommand -FilePath "corepack" -ArgumentList @("pnpm", "run", "check")
  }

  Invoke-Step -Name "tests" -Action {
    Invoke-NativeCommand -FilePath "corepack" -ArgumentList @("pnpm", "run", "test")
  }

  Invoke-Step -Name "build" -Action {
    Invoke-NativeCommand -FilePath "corepack" -ArgumentList @("pnpm", "run", "build")
  }

  Invoke-Step -Name "pre-deploy-check" -Action {
    Invoke-NativeCommand -FilePath $bashPath -ArgumentList @("infra/scripts/pre-deploy-check.sh")
  }

  Invoke-Step -Name "smoke-test" -Action {
    Invoke-NativeCommand -FilePath $bashPath -ArgumentList @("infra/scripts/smoke-test.sh")
  }

  Invoke-Step -Name "docker-compose-config" -Action {
    Invoke-NativeCommand -FilePath "docker" -ArgumentList @("compose", "-f", "docker-compose.yml", "config")
  }

  Invoke-Step -Name "overlap-audit" -Action {
    Invoke-NativeCommand -FilePath "powershell" -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ".\infra\scripts\overlap-audit.ps1")
  }

  Invoke-Step -Name "bash-syntax-deploy-handshake" -Action {
    Invoke-NativeCommand -FilePath $bashPath -ArgumentList @("-n", "infra/scripts/deploy-handshake.sh")
  }

  Invoke-Step -Name "bash-syntax-server-preflight" -Action {
    Invoke-NativeCommand -FilePath $bashPath -ArgumentList @("-n", "infra/scripts/server-preflight.sh")
  }

  Invoke-Step -Name "bash-syntax-server-cutover-smoke" -Action {
    Invoke-NativeCommand -FilePath $bashPath -ArgumentList @("-n", "infra/scripts/server-cutover-smoke.sh")
  }

  Invoke-Step -Name "bundle-build" -Action {
    Invoke-NativeCommand -FilePath "powershell" -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ".\infra\scripts\build-handoff-bundle.ps1")
  }

  Invoke-Step -Name "handoff-bundle-validation" -Action {
    Invoke-NativeCommand -FilePath $bashPath -ArgumentList @("infra/scripts/validate-handoff-bundle.sh")
  }

  Invoke-Step -Name "source-snapshot" -Action {
    Invoke-NativeCommand -FilePath "powershell" -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ".\infra\scripts\build-source-snapshot.ps1", "-Stamp", $stamp)
  }

  Invoke-Step -Name "ultimate-validator" -Action {
    Invoke-NativeCommand -FilePath $bashPath -ArgumentList @("infra/scripts/ultimate-validator.sh")
  }

  $placeholderHits = @(Find-PatternHits -Roots @("governance", "docs", "knowledge", "client", "server", "shared", "infra") -Pattern "^[ \t]*(TODO|TBD|coming soon|placeholder)[ \t]*$")
  $claimRiskHits = @(Filter-GuardrailHits -Hits (Find-PatternHits -Roots @("client", "server", "shared", "docs/migration") -Pattern "guaranteed savings|guaranteed roi|รับประกันผลตอบแทน|การันตีผลตอบแทน"))
  $selfInvocationHits = @(Find-SelfInvocationRisk)
  $legacyRuntimeDriftHits = @(Find-LegacyRuntimeDrift)
  $autonomyPromptDriftHits = @(Filter-GuardrailHits -Hits (Find-AutonomyPromptDrift))

  $bundleFiles = Get-ChildItem -LiteralPath (Join-Path $Root "04_deployment_bundle") -Recurse -File

  $summary = [pscustomobject]@{
    generatedAt = (Get-Date).ToString("o")
    root = $Root
    status = "passed"
    steps = $stepResults
    warnings = [pscustomobject]@{
      placeholderHits = $placeholderHits
      riskyClaimHits = $claimRiskHits
      selfInvocationRiskHits = $selfInvocationHits
      legacyRuntimeDriftHits = $legacyRuntimeDriftHits
      autonomyPromptDriftHits = $autonomyPromptDriftHits
    }
    bundle = [pscustomobject]@{
      path = (Join-Path $Root "04_deployment_bundle")
      fileCount = $bundleFiles.Count
      manifest = (Join-Path $Root "04_deployment_bundle\MANIFEST.json")
      checksums = (Join-Path $Root "04_deployment_bundle\CHECKSUMS.SHA256.txt")
    }
  }

  if (
    $placeholderHits.Count -gt 0 -or
    $claimRiskHits.Count -gt 0 -or
    $selfInvocationHits.Count -gt 0 -or
    $legacyRuntimeDriftHits.Count -gt 0 -or
    $autonomyPromptDriftHits.Count -gt 0
  ) {
    $summary.status = "passed-with-warnings"
  }

  $jsonPath = Join-Path $runDir "SIRINX_FULL_SYSTEM_REVIEW.json"
  $mdPath = Join-Path $runDir "SIRINX_FULL_SYSTEM_REVIEW.md"
  $zipPath = Join-Path $liveHandoffDir "SIRINX_MULTI_AGENT_HANDOFF_$stamp.zip"
  $sourceSnapshotZip = Join-Path $sourceSnapshotDir "SIRINX_SOURCE_SNAPSHOT_$stamp.zip"
  $stepLines = ($summary.steps | ForEach-Object {
      "- {0}: {1} (`{2}`)" -f $_.name, $_.status, $_.log
    }) -join "`r`n"

  ($summary | ConvertTo-Json -Depth 8) | Set-Content -LiteralPath $jsonPath -Encoding UTF8

  if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [System.IO.Compression.ZipFile]::CreateFromDirectory(
    (Join-Path $Root "04_deployment_bundle"),
    $zipPath,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $false
  )

  $zipSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $zipPath).Hash
  $sourceSnapshotSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $sourceSnapshotZip).Hash
  $validationPath = Join-Path $validationDir "SIRINX_MULTI_AGENT_VALIDATION_$stamp.json"
  $validationSummary = [pscustomobject]@{
    status = $summary.status
    validatedAt = (Get-Date).ToString("o")
    reviewJson = $jsonPath
    reviewMarkdown = $mdPath
    bundleDir = $summary.bundle.path
    bundleFileCount = $summary.bundle.fileCount
    bundleManifest = $summary.bundle.manifest
    bundleChecksums = $summary.bundle.checksums
    zipPath = $zipPath
    zipSha256 = $zipSha256
    sourceSnapshotZip = $sourceSnapshotZip
    sourceSnapshotSha256 = $sourceSnapshotSha256
    contractValidator = ($summary.steps | Where-Object { $_.name -eq "contract-validation" } | Select-Object -First 1).status
    typecheck = ($summary.steps | Where-Object { $_.name -eq "typecheck" } | Select-Object -First 1).status
    tests = ($summary.steps | Where-Object { $_.name -eq "tests" } | Select-Object -First 1).status
    build = ($summary.steps | Where-Object { $_.name -eq "build" } | Select-Object -First 1).status
    preDeployCheck = ($summary.steps | Where-Object { $_.name -eq "pre-deploy-check" } | Select-Object -First 1).status
    smokeTest = ($summary.steps | Where-Object { $_.name -eq "smoke-test" } | Select-Object -First 1).status
    composeConfig = ($summary.steps | Where-Object { $_.name -eq "docker-compose-config" } | Select-Object -First 1).status
    overlapAudit = ($summary.steps | Where-Object { $_.name -eq "overlap-audit" } | Select-Object -First 1).status
    sourceSnapshot = ($summary.steps | Where-Object { $_.name -eq "source-snapshot" } | Select-Object -First 1).status
    ultimateValidator = ($summary.steps | Where-Object { $_.name -eq "ultimate-validator" } | Select-Object -First 1).status
  }

  ($validationSummary | ConvertTo-Json -Depth 8) | Set-Content -LiteralPath $validationPath -Encoding UTF8

@"
# SIRINX Full System Review

- Status: $($summary.status)
- Generated at: $($summary.generatedAt)
- Root: $($summary.root)
- Bundle: $($summary.bundle.path)
- Bundle file count: $($summary.bundle.fileCount)
- Reviewed handoff zip: $zipPath
- Reviewed handoff zip SHA256: $zipSha256
- Source snapshot zip: $sourceSnapshotZip
- Source snapshot SHA256: $sourceSnapshotSha256

## Steps
$(
  $stepLines
)

## Warnings
- Placeholder hits: $($placeholderHits.Count)
- Risky claim hits: $($claimRiskHits.Count)
- Self-invocation loop-risk hits: $($selfInvocationHits.Count)
- Legacy runtime drift hits: $($legacyRuntimeDriftHits.Count)
- Autonomy prompt drift hits: $($autonomyPromptDriftHits.Count)
"@ | Set-Content -LiteralPath $mdPath -Encoding UTF8

  $summary | Add-Member -NotePropertyName "reviewJson" -NotePropertyValue $jsonPath
  $summary | Add-Member -NotePropertyName "reviewMarkdown" -NotePropertyValue $mdPath
  $summary | Add-Member -NotePropertyName "validationJson" -NotePropertyValue $validationPath
  $summary | Add-Member -NotePropertyName "handoffZip" -NotePropertyValue $zipPath
  $summary | Add-Member -NotePropertyName "handoffZipSha256" -NotePropertyValue $zipSha256
  $summary | Add-Member -NotePropertyName "sourceSnapshotZip" -NotePropertyValue $sourceSnapshotZip
  $summary | Add-Member -NotePropertyName "sourceSnapshotSha256" -NotePropertyValue $sourceSnapshotSha256

  Write-Output ($summary | ConvertTo-Json -Depth 8)
} finally {
  Pop-Location
}
