# deploy.ps1 —— 一键部署到 GitHub Pages
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
    # 没有文件改动：检查是否已完成过推送
    $upstream = git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null
    if ($upstream) {
        Write-Host "[=] 没有任何改动，无需部署"
        exit 0
    } else {
        # 首次部署：本地有 commit 但还没推送到 GitHub
        Write-Host "[*] 首次部署：推送到 GitHub..."
        git push -u origin main
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] 首次推送成功！"
            Write-Host "     接下来去网页开启 Pages："
            Write-Host "     Settings -> Pages -> Source 选 Deploy from branch -> Branch 选 main / (root) -> Save"
            Write-Host "     1~2 分钟后访问 https://<你的用户名>.github.io/bon-homepage/"
        } else {
            Write-Host "[X] push 失败：检查网络、GitHub 登录状态、remote 地址（git remote -v）"
            exit 1
        }
        exit 0
    }
}

if (-not $Message) {
    $Message = "update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}
git commit -m $Message
if ($LASTEXITCODE -ne 0) { Write-Host "[X] commit 失败"; exit 1 }

git push -u origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] 已推送。GitHub Pages 一般 1~2 分钟内更新，刷新网站即可看到。"
} else {
    Write-Host "[X] push 失败：检查网络、GitHub 登录状态、remote 地址（git remote -v）"
    exit 1
}
