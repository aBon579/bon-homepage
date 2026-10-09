# Bon 个人主页

黑底视频背景 + 点阵字标题的单页个人主页，纯静态 HTML/CSS/JS，部署在 GitHub Pages。

## 文件说明

| 文件 | 作用 |
|---|---|
| `index.html` | 主页（视频首屏 / 作品集 / 公众号二维码） |
| `styles.css` | 全部样式与动画 |
| `main.js` | 菜单、入场动画、数字滚动、星云画布 |
| `works-data.js` | **作品集唯一数据源**，日常只改这个文件 |
| `admin.html` | 本地可视化编辑器，导出 works-data.js 用 |
| `deploy.ps1` | 一键提交并推送到 GitHub |
| `assets/` | logo.webp（圆形头像）、wechat-qr.jpg（公众号二维码） |

## 日常维护（加作品）

1. 浏览器打开 `admin.html` → 填表（标题≤30字 / 链接 / 简介 / 关键词≤5 / 类别文章或视频）
2. 点「下载 works-data.js」，覆盖本目录同名文件
3. 运行 `powershell -ExecutionPolicy Bypass -File .\deploy.ps1`，一两分钟后线上生效

不想用 admin 就直接手改 `works-data.js`，格式看文件内注释。

## 本地预览

```
python -m http.server 8931
```

或使用 dsh 自带 Python 全路径：
`"C:\Users\86152\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe" -m http.server 8931`

浏览器访问 `http://127.0.0.1:8931/`（admin 编辑器在 `/admin.html`）。

## 首次部署 GitHub Pages

1. GitHub 上新建仓库（建议 public，名字如 `bon-homepage`，**不要**勾选任何初始化选项）
2. 在本文件夹执行：
   ```
   git remote add origin https://github.com/<你的用户名>/bon-homepage.git
   powershell -ExecutionPolicy Bypass -File .\deploy.ps1
   ```
   首次 push 会弹浏览器登录授权，装一次即可。
3. 仓库 Settings → Pages → Source 选 **Deploy from branch**，Branch 选 `main` / `(root)`，保存
4. 一两分钟后访问 `https://<你的用户名>.github.io/bon-homepage/`
