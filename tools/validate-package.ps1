# 主题包校验入口
#
# 为什么需要它：
#   validate_theme.py 复刻的是 Dream Skin「主题包目录」的校验规则 —— 它只允许目录里出现
#   theme.json + 一张 background.(png|jpg|webp)（可选 theme.css），**出现任何多余文件就报错**。
#   所以不能直接在仓库根目录跑（那里有 LICENSE、.gitignore、脚本等一堆文件）。
#   本脚本会把明 / 暗两套主题各自整理成一个干净的临时目录，再分别校验。
#
# 用法：
#   powershell -ExecutionPolicy Bypass -File .\tools\validate-package.ps1
param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$validator = Join-Path $Root 'validate_theme.py'
if (-not (Test-Path -LiteralPath $validator)) { throw "找不到 validate_theme.py：$validator" }

$suites = @(
  @{ Name = '明版 white-dragon-sky-tech'; Json = 'theme.json';       Image = 'background.png' },
  @{ Name = '夜版 sky-atelier-night';     Json = 'theme-night.json'; Image = 'background-night.png' }
)

$failed = 0
foreach ($s in $suites) {
  $jsonSrc = Join-Path $Root $s.Json
  $imgSrc = Join-Path $Root $s.Image
  $cssSrc = Join-Path $Root 'theme.css'
  if (-not (Test-Path -LiteralPath $jsonSrc)) { Write-Host "跳过（缺 $($s.Json)）"; continue }
  if (-not (Test-Path -LiteralPath $imgSrc)) { Write-Host "跳过（缺 $($s.Image)）"; continue }

  $tmp = Join-Path ([System.IO.Path]::GetTempPath()) ('sky-theme-check-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
  New-Item -ItemType Directory -Path $tmp -Force | Out-Null
  try {
    Copy-Item -LiteralPath $jsonSrc -Destination (Join-Path $tmp 'theme.json') -Force
    Copy-Item -LiteralPath $imgSrc -Destination (Join-Path $tmp 'background.png') -Force
    if (Test-Path -LiteralPath $cssSrc) {
      Copy-Item -LiteralPath $cssSrc -Destination (Join-Path $tmp 'theme.css') -Force
    }
    Copy-Item -LiteralPath $validator -Destination (Join-Path $tmp 'validate_theme.py') -Force

    Write-Host ''
    Write-Host ("=== " + $s.Name + " ===")
    $out = & python (Join-Path $tmp 'validate_theme.py') 2>&1
    $code = $LASTEXITCODE
    $out | ForEach-Object { Write-Host ("  " + $_) }
    if ($code -ne 0) { $failed++ }
  } finally {
    Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Write-Host ''
if ($failed -gt 0) {
  Write-Host "结果：$failed 套主题校验未通过" -ForegroundColor Red
  exit 1
} else {
  Write-Host '结果：全部主题包校验通过' -ForegroundColor Green
}
