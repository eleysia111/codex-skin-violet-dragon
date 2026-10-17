# 引擎样式表补丁工具（天空工坊）——带备份、幂等、可回滚。
#   -Action status   看现在有没有打补丁、备份情况、哈希
#   -Action apply    备份一次并写入 engine-patch.css 的内容（重复 apply 会先剥掉旧补丁）
#   -Action revert   还原到备份（若没有备份则只剥掉补丁块）
param(
  [ValidateSet('status', 'apply', 'revert')]
  [string]$Action = 'status',
  [switch]$Force
)
$ErrorActionPreference = 'Stop'

$engine = Join-Path $env:LOCALAPPDATA 'CodexDreamSkin\engine'
$css = Join-Path $engine 'assets\dream-skin.css'
$backupDir = Join-Path $PSScriptRoot 'engine-backups'
$patchFile = Join-Path $PSScriptRoot 'engine-patch.css'
$patchesDir = Join-Path $PSScriptRoot 'patches'
$pristine = Join-Path $backupDir 'dream-skin.css.original.bak'

$BEGIN = '/* >>> SKY-ATELIER PATCH BEGIN (generated) >>> */'
$END = '/* <<< SKY-ATELIER PATCH END <<< */'

function Read-Text([string]$p) { [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8) }
function Write-Text([string]$p, [string]$t) {
  $tmp = "$p.tmp-$([guid]::NewGuid().ToString('N').Substring(0,8))"
  [System.IO.File]::WriteAllText($tmp, $t, (New-Object System.Text.UTF8Encoding($false)))
  Move-Item -LiteralPath $tmp -Destination $p -Force
}
function Get-Hash([string]$p) { (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash }
function Strip-Patch([string]$text) {
  $i = $text.IndexOf($BEGIN)
  if ($i -lt 0) { return $text }
  $j = $text.IndexOf($END)
  if ($j -lt 0) { throw "补丁块不完整（有 BEGIN 无 END），请用 -Action revert" }
  return $text.Substring(0, $i) + $text.Substring($j + $END.Length)
}
function Test-Braces([string]$text) {
  $open = ([regex]::Matches($text, '\{')).Count
  $close = ([regex]::Matches($text, '\}')).Count
  return @{ Open = $open; Close = $close; Balanced = ($open -eq $close) }
}
# 手工覆盖块：engine-patch.css 是生成物（build_engine_patch.py 会从零重写），
# 手写规则一律放 patches\*.css，按文件名顺序在 END 标记前注入。
function Get-PatchFiles() {
  if (-not (Test-Path -LiteralPath $patchesDir)) { return @() }
  return @(Get-ChildItem -LiteralPath $patchesDir -File -Filter '*.css' |
    Sort-Object Name | ForEach-Object { $_.FullName })
}
function Get-ExtraCss() {
  $parts = @()
  foreach ($f in Get-PatchFiles) {
    $parts += "/* ---- injected from patches\$(Split-Path -Leaf $f) ---- */`n" + (Read-Text $f).TrimEnd()
  }
  if ($parts.Count -eq 0) { return '' }
  return ($parts -join "`n`n")
}

if (-not (Test-Path -LiteralPath $css)) { throw "找不到引擎样式表: $css" }
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$text = Read-Text $css
$patched = $text.Contains($BEGIN)

switch ($Action) {
  'status' {
    Write-Host "文件      : $css"
    Write-Host ("大小      : {0:N0} bytes" -f (Get-Item $css).Length)
    Write-Host "SHA256    : $(Get-Hash $css)"
    Write-Host "补丁状态  : $(if ($patched) { '已打补丁' } else { '原始（未打补丁）' })"
    $b = Test-Braces $text
    Write-Host ("花括号    : {0} 开 / {1} 闭  $(if ($b.Balanced) { '平衡 ✔' } else { '不平衡 ✘' })" -f $b.Open, $b.Close)
    Write-Host ("原始备份  : $(if (Test-Path $pristine) { $pristine } else { '（还没有——第一次 apply 时会创建）' })")
    if (Test-Path $pristine) { Write-Host ("            原始哈希 $(Get-Hash $pristine)") }
    Write-Host "补丁文件  : $(if (Test-Path $patchFile) { "$patchFile ($([math]::Round((Get-Item $patchFile).Length/1KB)) KB)" } else { '（还没有，先跑 tools/build_engine_patch.py）' })"
    $pfs = @(Get-PatchFiles)
    Write-Host "手工覆盖块: $(if ($pfs.Count -eq 0) { '（patches\ 为空）' } else { "$($pfs.Count) 个" })"
    $pfs | ForEach-Object { Write-Host ("            {0}  ({1:N0} bytes)" -f (Split-Path -Leaf $_), (Get-Item $_).Length) }
    $others = @(Get-ChildItem $backupDir -File -Filter '*.bak' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)
    Write-Host "备份列表  : $($others.Count) 个"
    $others | Select-Object -First 6 | ForEach-Object { Write-Host ("            {0}  {1:N0} bytes" -f $_.Name, $_.Length) }
  }

  'apply' {
    if (-not (Test-Path $patchFile)) { throw "缺少补丁内容: $patchFile（先跑 tools/build_engine_patch.py）" }
    $patch = Read-Text $patchFile
    if (-not $patch.Contains($BEGIN)) { throw "补丁文件缺少 BEGIN 标记，拒绝写入" }

    # 把 patches\*.css 定点插到 END 之前（重复 apply 幂等：Strip-Patch 会整块剥掉重来）
    $extras = Get-ExtraCss
    if ($extras) {
      $i = $patch.LastIndexOf($END)
      if ($i -lt 0) { throw "补丁文件缺少 END 标记，拒绝写入" }
      $patch = $patch.Substring(0, $i) + $extras.TrimEnd() + "`n`n" + $patch.Substring($i)
      $names = @(Get-PatchFiles | ForEach-Object { Split-Path -Leaf $_ })
      Write-Host "[patch] 注入手工覆盖块：$($names -join ', ')"
    }

    # 首次 apply：保存原始文件（只保存一次，永不覆盖）
    if (-not (Test-Path $pristine)) {
      Copy-Item -LiteralPath $css -Destination $pristine -Force
      Write-Host "[backup] 已保存原始样式表 -> $pristine"
      Write-Host "[backup] 原始 SHA256 = $(Get-Hash $pristine)"
    } else {
      Write-Host "[backup] 原始备份已存在，保持不动（$(Get-Hash $pristine)）"
    }
    # 每次 apply 再留一份带时间戳的快照，便于对比
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    Copy-Item -LiteralPath $css -Destination (Join-Path $backupDir "dream-skin.css.$stamp.bak") -Force

    $stripped = Strip-Patch $text
    $new = $stripped.TrimEnd() + "`n`n" + $patch.TrimEnd() + "`n"

    $b = Test-Braces $new
    if (-not $b.Balanced) { throw "补丁后花括号不平衡（$($b.Open)/$($b.Close)），已中止且未写入" }

    Write-Text $css $new
    $check = Read-Text $css
    $begins = ([regex]::Matches($check, [regex]::Escape($BEGIN))).Count
    $ends = ([regex]::Matches($check, [regex]::Escape($END))).Count
    if ($begins -ne 1 -or $ends -ne 1) {
      Copy-Item -LiteralPath $pristine -Destination $css -Force
      throw "写入后校验失败（BEGIN=$begins END=$ends），已自动回滚为原始文件"
    }
    Write-Host "[ok] 已打补丁：$(if ($patched) { '替换旧补丁' } else { '首次应用' })"
    Write-Host ("     大小 {0:N0} -> {1:N0} bytes" -f (Get-Item $pristine).Length, (Get-Item $css).Length)
    Write-Host "     新 SHA256 = $(Get-Hash $css)"
    Write-Host "     回滚命令：powershell -ExecutionPolicy Bypass -File patch-engine-css.ps1 -Action revert"
  }

  'revert' {
    if (Test-Path $pristine) {
      Copy-Item -LiteralPath $pristine -Destination $css -Force
      Write-Host "[ok] 已从原始备份还原：$css"
      Write-Host ("     大小 {0:N0} bytes  SHA256={1}" -f (Get-Item $css).Length, (Get-Hash $css))
    } else {
      $stripped = Strip-Patch $text
      Write-Text $css $stripped
      Write-Host "[ok] 没有原始备份，已仅剥掉补丁块"
      Write-Host "     SHA256=$(Get-Hash $css)"
    }
  }
}
