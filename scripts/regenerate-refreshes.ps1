[CmdletBinding()]
param(
  [string]$RootPath = "F:\Refreshes",
  [string]$GeneratorPath = "",
  [string[]]$Include = @(),
  [string[]]$Exclude = @("cruftless-site-gen"),
  [string]$JsonReportPath = "",
  [switch]$DryRun,
  [switch]$StopOnError
)

$ErrorActionPreference = "Stop"

function Resolve-RequiredPath {
  param(
    [string]$Path,
    [string]$Description
  )

  if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path -LiteralPath $Path)) {
    throw "$Description does not exist: $Path"
  }

  return (Resolve-Path -LiteralPath $Path).Path
}

function Test-AnyPatternMatch {
  param(
    [string]$Value,
    [string[]]$Patterns
  )

  foreach ($pattern in $Patterns) {
    if ($Value -like $pattern) {
      return $true
    }
  }

  return $false
}

function Get-RefreshSiteDirectories {
  param(
    [string]$BasePath,
    [string[]]$IncludePatterns,
    [string[]]$ExcludePatterns
  )

  Get-ChildItem -LiteralPath $BasePath -Directory |
    Where-Object {
      Test-Path -LiteralPath (Join-Path $_.FullName "content\site.json")
    } |
    Where-Object {
      $includeMatches = $IncludePatterns.Count -eq 0 -or
        (Test-AnyPatternMatch -Value $_.Name -Patterns $IncludePatterns)
      $excludeMatches = $ExcludePatterns.Count -gt 0 -and
        (Test-AnyPatternMatch -Value $_.Name -Patterns $ExcludePatterns)

      $includeMatches -and -not $excludeMatches
    } |
    Sort-Object Name
}

if ([string]::IsNullOrWhiteSpace($GeneratorPath)) {
  $GeneratorPath = Join-Path $PSScriptRoot ".."
}

$root = Resolve-RequiredPath -Path $RootPath -Description "Refresh root"
$generatorRoot = Resolve-RequiredPath -Path $GeneratorPath -Description "Generator checkout"
$generatorCli = Join-Path $generatorRoot "scripts\shared-site-gen.mjs"
$tsxCli = Join-Path $generatorRoot "node_modules\tsx\dist\cli.mjs"

if (-not (Test-Path -LiteralPath $generatorCli)) {
  throw "Shared generator CLI is missing: $generatorCli"
}

if (-not (Test-Path -LiteralPath $tsxCli)) {
  throw "Shared generator dependencies are missing in $generatorRoot. Run npm install there first."
}

if ([string]::IsNullOrWhiteSpace($JsonReportPath)) {
  $JsonReportPath = Join-Path $root "_refresh_regeneration_report.json"
}

$sites = @(Get-RefreshSiteDirectories -BasePath $root -IncludePatterns $Include -ExcludePatterns $Exclude)
$results = New-Object System.Collections.Generic.List[object]
$startedAt = Get-Date

Write-Host "Refresh root: $root"
Write-Host "Generator:    $generatorRoot"
Write-Host "Sites found:  $($sites.Count)"

if ($DryRun) {
  Write-Host ""
  Write-Host "Dry run only. These sites would be regenerated:"
  foreach ($site in $sites) {
    Write-Host "  - $($site.Name)"
    $results.Add([pscustomobject]@{
      site = $site.Name
      path = $site.FullName
      status = "dry-run"
      exitCode = 0
    })
  }
} else {
  foreach ($site in $sites) {
    $relativePath = Resolve-Path -LiteralPath $site.FullName -Relative
    Write-Host ""
    Write-Host "Regenerating $($site.Name)..."

    $siteStartedAt = Get-Date
    & node $generatorCli build $site.FullName
    $exitCode = $LASTEXITCODE
    $siteFinishedAt = Get-Date

    if ($exitCode -eq 0) {
      $status = "ok"
      Write-Host "Finished $($site.Name)."
    } else {
      $status = "failed"
      Write-Host "FAILED $($site.Name) with exit code $exitCode."
    }

    $results.Add([pscustomobject]@{
      site = $site.Name
      path = $site.FullName
      relativePath = $relativePath
      status = $status
      exitCode = $exitCode
      durationSeconds = [Math]::Round(($siteFinishedAt - $siteStartedAt).TotalSeconds, 3)
    })

    if ($exitCode -ne 0 -and $StopOnError) {
      break
    }
  }
}

$finishedAt = Get-Date
$failures = @($results | Where-Object { $_.status -eq "failed" })
$report = [pscustomobject]@{
  generatedAt = $finishedAt.ToString("o")
  rootPath = $root
  generatorPath = $generatorRoot
  dryRun = [bool]$DryRun
  siteCount = $sites.Count
  processedCount = $results.Count
  failureCount = $failures.Count
  durationSeconds = [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 3)
  results = $results.ToArray()
}

$report | ConvertTo-Json -Depth 5 | Set-Content -Path $JsonReportPath

Write-Host ""
Write-Host "Refresh regeneration complete."
Write-Host "Processed: $($results.Count)"
Write-Host "Failures:  $($failures.Count)"
Write-Host "Report:    $JsonReportPath"

if ($failures.Count -gt 0) {
  exit 1
}

exit 0
