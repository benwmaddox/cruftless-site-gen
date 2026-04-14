[CmdletBinding()]
param(
  [string]$RootPath = "F:\Refreshes",
  [string]$SharedSchemaUrl = "",
  [string]$JsonReportPath = "",
  [string]$TextReportPath = "",
  [switch]$SkipStrictValidation,
  [switch]$FailOnWarnings,
  [switch]$NoAutoFix
)

$ErrorActionPreference = "Stop"

trap {
  $lineInfo = if ($_.InvocationInfo -and $_.InvocationInfo.ScriptLineNumber) { $_.InvocationInfo.ScriptLineNumber } else { "unknown" }
  Write-Host ("VALIDATOR TRAP line {0}: {1}" -f $lineInfo, $_.Exception.Message)
  exit 99
}

if ([string]::IsNullOrWhiteSpace($JsonReportPath)) {
  $JsonReportPath = Join-Path $RootPath "_refresh_validation_report.json"
}

if ([string]::IsNullOrWhiteSpace($TextReportPath)) {
  $TextReportPath = Join-Path $RootPath "_refresh_validation_report.txt"
}

if ([string]::IsNullOrWhiteSpace($SharedSchemaUrl)) {
  $sharedSchemaPath = Join-Path $RootPath "cruftless-site-gen\schemas\site-content.schema.json"
  $SharedSchemaUrl = ([System.Uri]$sharedSchemaPath).AbsoluteUri
}

$normalizeScriptSource = @'
const fs = require('fs');
const file = process.env.REFRESH_JSON_FILE;
if (!file) {
  throw new Error('REFRESH_JSON_FILE is not set');
}
const fix = process.env.REFRESH_JSON_FIX === '1';
const original = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
const normalized = JSON.stringify(JSON.parse(original), null, 2) + '\n';
if (original !== normalized) {
  if (fix) {
    fs.writeFileSync(file, normalized);
  }
  process.exit(10);
}
'@

$bannedPatterns = @(
  @{ Check = "banned-copy"; Severity = "error"; Pattern = "(?i)\bwhat the live site\b"; Message = "Public copy still contains meta wording about the live site." },
  @{ Check = "banned-copy"; Severity = "error"; Pattern = "(?i)\bsource site\b"; Message = "Public copy still contains meta wording about the source site." },
  @{ Check = "banned-copy"; Severity = "error"; Pattern = "(?i)\blive site\b"; Message = "Public copy still contains meta wording about the live site." },
  @{ Check = "banned-copy"; Severity = "error"; Pattern = "(?i)\bwhat this demo\b"; Message = "Public copy still contains demo wording." },
  @{ Check = "banned-copy"; Severity = "error"; Pattern = "(?i)\bthis demo\b"; Message = "Public copy still contains demo wording." },
  @{ Check = "banned-copy"; Severity = "error"; Pattern = "(?i)\bpreserved from\b"; Message = "Public copy still contains rebuild commentary." },
  @{ Check = "banned-copy"; Severity = "error"; Pattern = "(?i)\bthe redesign\b"; Message = "Public copy still contains redesign commentary." },
  @{ Check = "banned-copy"; Severity = "error"; Pattern = "(?i)\bthe rebuild\b"; Message = "Public copy still contains rebuild commentary." },
  @{ Check = "template-copy"; Severity = "error"; Pattern = "(?i)\ba strong brochure-style landing page template\b"; Message = "Public copy still contains default template metadata." },
  @{ Check = "template-copy"; Severity = "error"; Pattern = "(?i)\bthree service buckets that fit most brochure sites\b"; Message = "Public copy still contains default template section wording." },
  @{ Check = "template-copy"; Severity = "error"; Pattern = "(?i)\ba homepage usually works better when it answers these questions early\b"; Message = "Public copy still contains default template section wording." },
  @{ Check = "template-copy"; Severity = "error"; Pattern = "(?i)\ba simple landing-page rhythm that is easy to customize\b"; Message = "Public copy still contains default template section wording." },
  @{ Check = "template-copy"; Severity = "error"; Pattern = "(?i)\bcommon homepage questions\b"; Message = "Public copy still contains default template section wording." },
  @{ Check = "template-copy"; Severity = "error"; Pattern = "(?i)\bstart with a stronger default flow\b"; Message = "Public copy still contains default template section wording." },
  @{ Check = "template-copy"; Severity = "error"; Pattern = "(?i)\ba default services page structure\b"; Message = "Public copy still contains default template metadata." },
  @{ Check = "template-copy"; Severity = "error"; Pattern = "(?i)\ba useful default services breakdown\b"; Message = "Public copy still contains default template section wording." },
  @{ Check = "template-copy"; Severity = "error"; Pattern = "(?i)\ba default about page\b"; Message = "Public copy still contains default template metadata." },
  @{ Check = "template-copy"; Severity = "error"; Pattern = "(?i)\bcommon trust signals to capture here\b"; Message = "Public copy still contains default template section wording." },
  @{ Check = "template-copy"; Severity = "error"; Pattern = "(?i)\bdefault contact structure\b"; Message = "Public copy still contains default template metadata." },
  @{ Check = "placeholder-copy"; Severity = "error"; Pattern = "(?i)\bemail@example\.com\b"; Message = "Public copy still contains a placeholder email." },
  @{ Check = "placeholder-copy"; Severity = "error"; Pattern = "(?i)\b\(555\)\s*555-5555\b"; Message = "Public copy still contains a placeholder phone number." },
  @{ Check = "placeholder-copy"; Severity = "error"; Pattern = "(?i)\b123 Example Street\b"; Message = "Public copy still contains a placeholder street address." },
  @{ Check = "placeholder-copy"; Severity = "error"; Pattern = "(?i)\bExample City\b"; Message = "Public copy still contains a placeholder city." }
)

$suspiciousPatterns = @(
  @{ Check = "suspicious-copy"; Severity = "warning"; Pattern = "(?i)^this page\b"; Message = "Public copy starts with 'This page', which often reads like internal commentary." },
  @{ Check = "suspicious-copy"; Severity = "warning"; Pattern = "(?i)^the page\b"; Message = "Public copy starts with 'The page', which often reads like internal commentary." },
  @{ Check = "suspicious-copy"; Severity = "warning"; Pattern = "(?i)^the site\b"; Message = "Public copy starts with 'The site', which often reads like internal commentary." },
  @{ Check = "suspicious-copy"; Severity = "warning"; Pattern = "(?i)^this redesign\b"; Message = "Public copy starts with 'This redesign', which usually belongs in notes, not the site." },
  @{ Check = "suspicious-copy"; Severity = "warning"; Pattern = "(?i)^this rebuild\b"; Message = "Public copy starts with 'This rebuild', which usually belongs in notes, not the site." }
)

function New-Finding {
  param(
    [string]$Site,
    [string]$Severity,
    [string]$Check,
    [string]$Message,
    [string]$FilePath = "",
    [string]$JsonPath = ""
  )

  [pscustomobject]@{
    site = $Site
    severity = $Severity
    check = $Check
    message = $Message
    file = $FilePath
    jsonPath = $JsonPath
  }
}

function Get-SiteDirectories {
  param([string]$BasePath)

  Get-ChildItem $BasePath -Directory |
    Where-Object {
      $_.Name -notlike "78thstreet*" -and
      $_.Name -ne "cruftless-site-gen" -and
      (Test-Path (Join-Path $_.FullName "content\site.json"))
    } |
    Sort-Object Name
}

function Repair-JsonFormat {
  param(
    [string]$FilePath,
    [bool]$AutoFix
  )

  $previousJsonFile = $env:REFRESH_JSON_FILE
  $previousJsonFix = $env:REFRESH_JSON_FIX
  $env:REFRESH_JSON_FILE = $FilePath
  $env:REFRESH_JSON_FIX = if ($AutoFix) { "1" } else { "0" }

  try {
    $nodeArgs = @("-e", $normalizeScriptSource)
    & node @nodeArgs
    $exitCode = $LASTEXITCODE
    if ($exitCode -eq 10) {
      if ($AutoFix) {
        return "fixed"
      }

      return "needs-fix"
    }

    if ($exitCode -ne 0) {
      throw "Node normalization failed for $FilePath"
    }

    return "current"
  } finally {
    if ($null -eq $previousJsonFile) {
      Remove-Item Env:REFRESH_JSON_FILE -ErrorAction SilentlyContinue
    } else {
      $env:REFRESH_JSON_FILE = $previousJsonFile
    }

    if ($null -eq $previousJsonFix) {
      Remove-Item Env:REFRESH_JSON_FIX -ErrorAction SilentlyContinue
    } else {
      $env:REFRESH_JSON_FIX = $previousJsonFix
    }
  }
}

function Get-CanonicalPathString {
  param([string]$Path)

  if ([string]::IsNullOrWhiteSpace($Path)) {
    return $null
  }

  try {
    return [System.IO.Path]::GetFullPath($Path).Replace("\", "/").ToLowerInvariant()
  } catch {
    return $null
  }
}

function Test-SharedSchemaSettings {
  param(
    [string]$SettingsPath,
    [string]$ExpectedUrl
  )

  if (-not (Test-Path $SettingsPath)) {
    return $false
  }

  try {
    $settings = Get-Content -Raw $SettingsPath | ConvertFrom-Json
  } catch {
    return $false
  }

  $schemas = $settings.'json.schemas'
  if (-not $schemas) {
    return $false
  }

  $settingsDirectory = Split-Path -Parent $SettingsPath
  $workspaceRoot = Split-Path -Parent $settingsDirectory
  $expectedCanonicalPaths = New-Object System.Collections.Generic.List[string]
  try {
    $expectedUri = [System.Uri]$ExpectedUrl
    if ($expectedUri.IsFile) {
      $expectedCanonicalPath = Get-CanonicalPathString -Path $expectedUri.LocalPath
      if ($expectedCanonicalPath) {
        $expectedCanonicalPaths.Add($expectedCanonicalPath)
      }
    }
  } catch {
  }

  $canonicalSharedSchemaPath = "F:\cruftless-site-gen\schemas\site-content.schema.json"
  if (Test-Path -LiteralPath $canonicalSharedSchemaPath) {
    $canonicalSharedSchema = Get-CanonicalPathString -Path $canonicalSharedSchemaPath
    if ($canonicalSharedSchema -and -not $expectedCanonicalPaths.Contains($canonicalSharedSchema)) {
      $expectedCanonicalPaths.Add($canonicalSharedSchema)
    }
  }

  foreach ($schema in $schemas) {
    $schemaUrl = [string]$schema.url
    $matchesExpectedSchema = $schemaUrl -eq $ExpectedUrl

    if (-not $matchesExpectedSchema -and $expectedCanonicalPaths.Count -gt 0) {
      $candidateCanonicalPath = $null

      try {
        $schemaUri = $null
        if ([System.Uri]::TryCreate($schemaUrl, [System.UriKind]::Absolute, [ref]$schemaUri) -and $schemaUri.IsFile) {
          $candidateCanonicalPath = Get-CanonicalPathString -Path $schemaUri.LocalPath
        } else {
          $candidateCanonicalPath = Get-CanonicalPathString -Path (Join-Path $workspaceRoot $schemaUrl)
        }
      } catch {
        $candidateCanonicalPath = $null
      }

      $matchesExpectedSchema = $candidateCanonicalPath -and $expectedCanonicalPaths.Contains($candidateCanonicalPath)
    }

    if ($matchesExpectedSchema) {
      $matches = @($schema.fileMatch)
      if ($matches -contains "/content/*.json" -and $matches -contains "/content/**/*.json") {
        return $true
      }
    }
  }

  return $false
}

function Add-TextFindings {
  param(
    [string]$Site,
    $Value,
    [string]$JsonPath,
    [string]$FilePath,
    $Findings
  )

  if ($null -eq $Value) {
    return
  }

  if ($Value -is [string]) {
    foreach ($rule in $bannedPatterns + $suspiciousPatterns) {
      if ($Value -match $rule.Pattern) {
        $Findings.Add((New-Finding -Site $Site -Severity $rule.Severity -Check $rule.Check -Message ($rule.Message + " Value: " + $Value) -FilePath $FilePath -JsonPath $JsonPath))
      }
    }
    return
  }

  if ($Value -is [System.Collections.IEnumerable] -and -not ($Value -is [string])) {
    $index = 0
    foreach ($item in $Value) {
      Add-TextFindings -Site $Site -Value $item -JsonPath ($JsonPath + "[" + $index + "]") -FilePath $FilePath -Findings $Findings
      $index += 1
    }
    return
  }

  foreach ($property in $Value.PSObject.Properties) {
    $nextPath = if ([string]::IsNullOrWhiteSpace($JsonPath)) { $property.Name } else { $JsonPath + "." + $property.Name }
    Add-TextFindings -Site $Site -Value $property.Value -JsonPath $nextPath -FilePath $FilePath -Findings $Findings
  }
}

function Find-LandingImageReference {
  param($Value)

  if ($null -eq $Value) {
    return $null
  }

  if ($Value -is [string]) {
    return $null
  }

  if ($Value -is [System.Collections.IEnumerable] -and -not ($Value -is [string]) -and -not ($Value -is [pscustomobject])) {
    foreach ($item in $Value) {
      $match = Find-LandingImageReference -Value $item
      if ($match) {
        return $match
      }
    }
    return $null
  }

  if ($Value.PSObject.Properties["src"] -and [string]$Value.src -match "^/content/images/landing-page\.[A-Za-z0-9]+$") {
    return $Value
  }

  foreach ($property in $Value.PSObject.Properties) {
    $match = Find-LandingImageReference -Value $property.Value
    if ($match) {
      return $match
    }
  }

  return $null
}

function Get-HomePageLandingImageReference {
  param($SiteJson)

  $homePage = @($SiteJson.pages | Where-Object { $_.slug -eq "/" }) | Select-Object -First 1
  if (-not $homePage) {
    return $null
  }

  return Find-LandingImageReference -Value $homePage.components
}

function Write-TextReport {
  param(
    [string]$Path,
    [int]$SiteCount,
    $Findings
  )

  $errors = @($Findings | Where-Object { $_.severity -eq "error" })
  $warnings = @($Findings | Where-Object { $_.severity -eq "warning" })

  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add("Refresh Validation Report")
  $lines.Add("Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")")
  $lines.Add("Sites checked: $SiteCount")
  $lines.Add("Errors: $($errors.Count)")
  $lines.Add("Warnings: $($warnings.Count)")
  $lines.Add("")

  foreach ($group in ($Findings | Group-Object site | Sort-Object Name)) {
    $lines.Add("[$($group.Name)]")
    foreach ($finding in $group.Group) {
      $location = if ($finding.jsonPath) { " [$($finding.jsonPath)]" } elseif ($finding.file) { " [$($finding.file)]" } else { "" }
      $lines.Add("- $($finding.severity.ToUpper()) $($finding.check)${location}: $($finding.message)")
    }
    $lines.Add("")
  }

  Set-Content -Path $Path -Value $lines
}

$sites = Get-SiteDirectories -BasePath $RootPath
$findings = New-Object System.Collections.Generic.List[object]

foreach ($siteDir in $sites) {
  $siteName = $siteDir.Name
  $siteJsonPath = Join-Path $siteDir.FullName "content\site.json"
  $settingsPath = Join-Path $siteDir.FullName ".vscode\settings.json"
  $distIndexPath = Join-Path $siteDir.FullName "dist\index.html"
  $contentImagesPath = Join-Path $siteDir.FullName "content\images"
  $distContentImagesPath = Join-Path $siteDir.FullName "dist\content\images"
  $distAssetImagesPath = Join-Path $siteDir.FullName "dist\assets\images"

  try {
    try {
      $siteJson = Get-Content -Raw $siteJsonPath | ConvertFrom-Json
    } catch {
      $findings.Add((New-Finding -Site $siteName -Severity "error" -Check "json-parse" -Message "content/site.json could not be parsed." -FilePath $siteJsonPath))
      continue
    }

    try {
      $formatState = Repair-JsonFormat -FilePath $siteJsonPath -AutoFix (-not $NoAutoFix)
      if ($formatState -eq "fixed") {
        $findings.Add((New-Finding -Site $siteName -Severity "info" -Check "json-format-fixed" -Message "content/site.json was normalized to 2-space JSON formatting." -FilePath $siteJsonPath))
      } elseif ($formatState -eq "needs-fix") {
        $findings.Add((New-Finding -Site $siteName -Severity "error" -Check "json-format" -Message "content/site.json is not normalized to 2-space JSON formatting. Run without -NoAutoFix to repair it automatically." -FilePath $siteJsonPath))
      }
    } catch {
      $findings.Add((New-Finding -Site $siteName -Severity "error" -Check "json-format" -Message $_.Exception.Message -FilePath $siteJsonPath))
    }

    if (-not (Test-SharedSchemaSettings -SettingsPath $settingsPath -ExpectedUrl $SharedSchemaUrl)) {
      $findings.Add((New-Finding -Site $siteName -Severity "error" -Check "schema-settings" -Message "VS Code settings are missing the shared schema reference." -FilePath $settingsPath))
    }

    Add-TextFindings -Site $siteName -Value $siteJson -JsonPath "" -FilePath $siteJsonPath -Findings $findings

    $localLandingAsset = @(Get-ChildItem $contentImagesPath -Filter "landing-page.*" -ErrorAction SilentlyContinue) | Select-Object -First 1
    $homeMedia = Get-HomePageLandingImageReference -SiteJson $siteJson

    if ($localLandingAsset -and -not $homeMedia) {
      $findings.Add((New-Finding -Site $siteName -Severity "error" -Check "landing-image" -Message "Local landing-page image exists but the home page does not reference it in homepage content." -FilePath $siteJsonPath))
    }

    if ($homeMedia -and -not $localLandingAsset) {
      $findings.Add((New-Finding -Site $siteName -Severity "error" -Check "landing-image" -Message "Home page content references a landing-page image but no local landing-page asset exists in content/images." -FilePath $siteJsonPath -JsonPath "pages[/].components"))
    }

    if (-not $SkipStrictValidation) {
      $strictOutput = & npm run validate:strict --prefix $siteDir.FullName 2>&1
      if ($LASTEXITCODE -ne 0) {
        $message = "npm run validate:strict failed."
        if ($strictOutput) {
          $message += " " + (($strictOutput | Select-Object -First 12) -join " ").Trim()
        }
        $findings.Add((New-Finding -Site $siteName -Severity "error" -Check "strict-validation" -Message $message -FilePath $siteDir.FullName))
        continue
      }
    }

    if ($localLandingAsset) {
      $distLandingAsset = @(
        Get-ChildItem $distContentImagesPath -Filter "landing-page.*" -ErrorAction SilentlyContinue
        Get-ChildItem $distAssetImagesPath -Filter "landing-page-*" -ErrorAction SilentlyContinue
      ) | Select-Object -First 1
      if (-not $distLandingAsset) {
        $findings.Add((New-Finding -Site $siteName -Severity "error" -Check "dist-asset" -Message "Local landing-page image exists but no built landing-page-derived asset was found in dist." -FilePath $distAssetImagesPath))
      }

      if (-not (Test-Path $distIndexPath)) {
        $findings.Add((New-Finding -Site $siteName -Severity "error" -Check "dist-index" -Message "dist/index.html is missing after strict validation." -FilePath $distIndexPath))
      } else {
        $distIndex = Get-Content -Raw $distIndexPath
        if ($distLandingAsset -and $distIndex -notmatch [regex]::Escape($distLandingAsset.Name)) {
          $findings.Add((New-Finding -Site $siteName -Severity "error" -Check "dist-index" -Message "dist/index.html does not reference the localized landing-page image." -FilePath $distIndexPath))
        }
      }
    }
  } catch {
    $lineInfo = if ($_.InvocationInfo -and $_.InvocationInfo.ScriptLineNumber) { " Line " + $_.InvocationInfo.ScriptLineNumber + "." } else { "" }
    $findings.Add((New-Finding -Site $siteName -Severity "error" -Check "validator-runtime" -Message ("Validator runtime error." + $lineInfo + " " + $_.Exception.Message) -FilePath $siteDir.FullName))
  }
}

$allFindings = $findings.ToArray()

$report = [pscustomobject]@{
  generatedAt = (Get-Date).ToString("o")
  rootPath = $RootPath
  siteCount = $sites.Count
  errorCount = @($allFindings | Where-Object { $_.severity -eq "error" }).Count
  warningCount = @($allFindings | Where-Object { $_.severity -eq "warning" }).Count
  findings = $allFindings
}

$report | ConvertTo-Json -Depth 6 | Set-Content -Path $JsonReportPath
Write-TextReport -Path $TextReportPath -SiteCount $sites.Count -Findings $allFindings

$errors = @($allFindings | Where-Object { $_.severity -eq "error" })
$warnings = @($allFindings | Where-Object { $_.severity -eq "warning" })

Write-Host ""
Write-Host "Refresh validation complete."
Write-Host "Sites checked: $($sites.Count)"
Write-Host "Errors: $($errors.Count)"
Write-Host "Warnings: $($warnings.Count)"
Write-Host "JSON report: $JsonReportPath"
Write-Host "Text report: $TextReportPath"

if ($errors.Count -gt 0) {
  exit 1
}

if ($FailOnWarnings -and $warnings.Count -gt 0) {
  exit 2
}

exit 0


