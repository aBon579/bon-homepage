# deploy.ps1 —— 一键部署到 GitHub Pages
# 用法：在本文件夹打开 PowerShell，运行  powershell -ExecutionPolicy Bypass -File .\deploy.ps1
#       带说明提交：.\deploy.ps1 -Message "新增作品：xxx"
param([string]$Message = "")
Set-Location $PSScriptRoot

if (-not (Test-Path ".git")) {
    Write-Host "[X] 当前目录不是 git 仓库，先完成首次部署（见 README.md）"
    exit 1
}

git add -A
$staged = git status --porcelain

if (-not $staged) {
    # 没有文件改动：检查是否已完成过推送（用 cmd 隔离 stderr，避免 PowerShell 把它当异常）
    $upstream = cmd /c 'git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>nul'
    if ($upstream) {
        Write-Host "[=] 没有任何改动，无需部署"
        exit 0
    } else {
        Write-Host "[*] 首次部署：推送到 GitHub..."
        git push -u origin main 2>&1 | ForEach-Object { "$_" }
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] 首次推送成功！"
            Write-Host "     接下来去网页开启 Pages："
            Write-Host "     Settings -> Pages -> Source 选 Deploy from branch -> Branch 选 main / (root) -> Save"
            Write-Host "     1~2 分钟后访问 https://abon579.github.io/bon-homepage/"
        } else {
            Write-Host "[X] push 失败：检查代理/网络、GitHub 登录状态、remote 地址（git remote -v）"
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

git push -u origin main 2>&1 | ForEach-Object { "$_" }
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] 已推送。GitHub Pages 一般 1~2 分钟内更新，刷新网站即可看到。"
} else {
    Write-Host "[X] push 失败：检查代理/网络、GitHub 登录状态、remote 地址（git remote -v）"
    exit 1
}
