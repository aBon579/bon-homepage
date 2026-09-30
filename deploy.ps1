# deploy.ps1 —— 一键更新 GitHub Pages
# 用法：在本文件夹打开 PowerShell，运行  .\deploy.ps1
#       带说明提交：.\deploy.ps1 -Message "新增作品：xxx"
param([string]$Message = "")
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".git")) {
    Write-Host "[X] 当前目录不是 git 仓库，先完成首次部署（见 README.md）"
    exit 1
}

git add -A
$staged = git status --porcelain
if (-not $staged) {
    Write-Host "[=] 没有任何改动，无需部署"
    exit 0
}

if (-not $Message) {
    $Message = "update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}
git commit -m $Message
if ($LASTEXITCODE -ne 0) { Write-Host "[X] commit 失败"; exit 1 }

git push
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] 已推送。GitHub Pages 一般 1~2 分钟内更新，刷新网站即可看到。"
} else {
    Write-Host "[X] push 失败：检查网络、GitHub 登录状态、remote 地址（git remote -v）"
    exit 1
}
