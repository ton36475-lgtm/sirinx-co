#Requires -RunAsAdministrator
# SIRINX Scheduled Task Installer
# Run this script once as Administrator:
#   Right-click PowerShell → "Run as administrator"
#   cd C:\Users\Ton36\AI-WarRoom
#   powershell -ExecutionPolicy Bypass -File scripts\install-scheduled-tasks.ps1

$ROOT = "C:\Users\Ton36\AI-WarRoom"
$NODE = (Get-Command node).Source

Write-Host "Installing SIRINX scheduled tasks..." -ForegroundColor Cyan

# ── Task 1: Telegram Bot at logon ─────────────────────────────────────────────
$botAction   = New-ScheduledTaskAction -Execute $NODE -Argument "scripts\sirinx-bot.js" -WorkingDirectory $ROOT
$botTrigger  = New-ScheduledTaskTrigger -AtLogOn
$botSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 5)
$botPrincipal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

Register-ScheduledTask `
  -TaskName "SIRINX_Bot_Startup" `
  -Action $botAction `
  -Trigger $botTrigger `
  -Settings $botSettings `
  -Principal $botPrincipal `
  -Description "SIRINX Telegram Bot — starts at logon, 3 auto-retries" `
  -Force

Write-Host "  [OK] SIRINX_Bot_Startup registered (runs at logon)" -ForegroundColor Green

# ── Task 2: Daily Report at 09:00 Bangkok (02:00 UTC) ─────────────────────────
# Bangkok is UTC+7. 09:00 Bangkok = 02:00 UTC.
# Windows Task Scheduler uses LOCAL time, so adjust if machine is NOT in Bangkok tz.
# If the machine is set to Asia/Bangkok (UTC+7), use 09:00.
# If the machine is in another timezone, adjust accordingly.

$tz = [System.TimeZoneInfo]::Local
Write-Host "`n  Machine timezone: $($tz.DisplayName)" -ForegroundColor Yellow

# Calculate local time that corresponds to 09:00 Bangkok (UTC+7)
$bangkokOffset = [System.TimeSpan]::FromHours(7)
$localOffset   = $tz.BaseUtcOffset
$diff          = $bangkokOffset - $localOffset
$localHour     = (9 - [int]$diff.TotalHours + 24) % 24
$localMinute   = 0

Write-Host "  Daily report will trigger at $("{0:D2}:{1:D2}" -f $localHour, $localMinute) local time (= 09:00 Bangkok)" -ForegroundColor Yellow

$reportAction   = New-ScheduledTaskAction -Execute $NODE -Argument "scripts\daily-report.js" -WorkingDirectory $ROOT
$reportTrigger  = New-ScheduledTaskTrigger -Daily -At "$("{0:D2}:{1:D2}" -f $localHour, $localMinute)"
$reportSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable
$reportPrincipal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

Register-ScheduledTask `
  -TaskName "SIRINX_DailyReport_9AM" `
  -Action $reportAction `
  -Trigger $reportTrigger `
  -Settings $reportSettings `
  -Principal $reportPrincipal `
  -Description "SIRINX Daily Executive Report — 09:00 Bangkok every day" `
  -Force

Write-Host "  [OK] SIRINX_DailyReport_9AM registered (daily at 09:00 Bangkok)" -ForegroundColor Green

Write-Host "`nDone! Verify with:" -ForegroundColor Cyan
Write-Host "  Get-ScheduledTask | Where-Object TaskName -like 'SIRINX*' | Format-Table TaskName, State"
