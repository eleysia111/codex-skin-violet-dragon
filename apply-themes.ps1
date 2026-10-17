# 安装天空工坊明暗两套主题：亮版激活，夜版存入库中（托盘里随时切）。
# 用法：
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File apply-themes.ps1
param([string]$ThemeDir = $PSScriptRoot)
$ErrorActionPreference = 'Stop'

$eng = Join-Path $env:LOCALAPPDATA 'CodexDreamSkin\engine'
if (-not (Test-Path -LiteralPath $eng)) { throw "Dream Skin 引擎未安装: $eng" }

. (Join-Path $eng 'scripts\config-utf8.ps1')
. (Join-Path $eng 'scripts\common-windows.ps1')
. (Join-Path $eng 'scripts\theme-windows.ps1')

$paths = Get-DreamSkinThemePaths

$themes = @(
  @{ Id = 'white-dragon-sky-tech'; Json = 'theme.json';       Image = 'background.png';       Activate = $true  },
  @{ Id = 'sky-atelier-night';     Json = 'theme-night.json'; Image = 'background-night.png'; Activate = $false }
)

foreach ($t in $themes) {
  $saved = Join-Path $paths.Saved $t.Id
  New-Item -ItemType Directory -Path $saved -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $ThemeDir $t.Json)  -Destination (Join-Path $saved 'theme.json')     -Force
  Copy-Item -LiteralPath (Join-Path $ThemeDir $t.Image) -Destination (Join-Path $saved 'background.png') -Force
  $css = Join-Path $ThemeDir 'theme.css'
  if (Test-Path -LiteralPath $css) {
    Copy-Item -LiteralPath $css -Destination (Join-Path $saved 'theme.css') -Force
  }
  $read = Read-DreamSkinTheme -ThemeDirectory $saved
  Write-Host ("[saved] {0,-24} id={1}  name={2}" -f $t.Id, $read.Theme.id, $read.Theme.name)

  if ($t.Activate) {
    $params = @{ ImagePath = $read.ImagePath; Theme = $read.Theme; Name = $read.Theme.name }
    if (Test-Path -LiteralPath (Join-Path $saved 'theme.css')) { $params['SafeCssPath'] = Join-Path $saved 'theme.css' }
    Set-DreamSkinActiveTheme @params
    Write-Host ("[active] {0}" -f $read.Theme.name)
  }
}

Write-Host 'active-theme 内容：'
Get-ChildItem -LiteralPath $paths.Active -File | ForEach-Object { Write-Host ("      {0,-30} {1,10:N0} bytes" -f $_.Name, $_.Length) }
Write-Host 'saved themes：'
Get-ChildItem -LiteralPath $paths.Saved -Directory | ForEach-Object { Write-Host ("      {0}" -f $_.Name) }
