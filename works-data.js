/* ============================================================
 * works-data.js —— 作品集数据（唯一数据源）
 *
 * 每次发完公众号 / 视频，往下面的数组里加一条即可，主页自动渲染。
 * 字段规则：
 *   title    标题，最多 30 个字
 *   link     跳转链接（公众号文章 / B站视频地址），填了才能点
 *   desc     简介，一句话
 *   keywords 关键词数组，最多 5 个
 *   category 作品类别，只能填 "文章" 或 "视频"
 *
 * 不想手改代码的话，用 admin.html 可视化编辑，
 * 编辑完点「下载 works-data.js」，用下载的文件覆盖本文件即可。
 * ============================================================ */
window.WORKS = [
  {
    title: "飞牛音乐 TV 端",
    link: "",
    desc: "箭头音乐上线电视端，NAS 音乐上电视的全新途径。",
    keywords: ["NAS", "音乐", "TV"],
    category: "文章"
  },
  {
    title: "飞牛音乐正式公测",
    link: "",
    desc: "公测上线，上架各大手机应用商店。",
    keywords: ["App", "音乐"],
    category: "文章"
  },
  {
    title: "音乐元数据刮削",
    link: "",
    desc: "补全计划两部曲，把曲库信息一项项补齐。",
    keywords: ["NAS", "工具", "音乐"],
    category: "文章"
  },
  {
    title: "NAS 管家 · DeepSeek Harness",
    link: "",
    desc: "飞牛专属管家模式，给 NAS 装一个零成本的大脑。",
    keywords: ["AI", "NAS", "DeepSeek"],
    category: "文章"
  },
  {
    title: "飞牛 Hermes 升级",
    link: "",
    desc: "问题排查与进阶玩法，管家模式再进化。",
    keywords: ["AI", "NAS"],
    category: "文章"
  },
  {
    title: "NAS + 老音箱 = HomePod",
    link: "",
    desc: "有源老音箱接上 NAS，低成本变身 HomePod。",
    keywords: ["硬件", "音频", "DIY"],
    category: "文章"
  },
  {
    title: "TokenSee",
    link: "",
    desc: "令牌分析小工具，把模型成本看得明明白白。",
    keywords: ["工具", "AI"],
    category: "文章"
  },
  {
    title: "Harness 桌面端插件",
    link: "",
    desc: "官方桌面端插件的安装尝鲜与踩坑记录。",
    keywords: ["工具", "教程"],
    category: "文章"
  }
];
