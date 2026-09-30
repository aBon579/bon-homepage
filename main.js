/* ============================================================
   Bon 个人主页 — main.js
   菜单 / 入场动画 / 实时统计 / 球形自转星图 / 三行交错滚动卡片
   ============================================================ */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- background video ---------------- */
  const video = $(".bg-video");
  if (video) {
    if (reduced) {
      video.removeAttribute("autoplay");
      video.pause();
    } else {
      const tryPlay = () => {
        const p = video.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      };
      if (video.readyState >= 2) tryPlay();
      else video.addEventListener("canplay", tryPlay, { once: true });
    }
  }

  /* ---------------- mobile menu ---------------- */
  const burger = $("#burger");
  const overlay = $("#menuOverlay");
  const menu = $("#mobileMenu");
  let menuTimer = 0;

  function openMenu() {
    if (!burger || !overlay || !menu) return;
    clearTimeout(menuTimer);
    overlay.hidden = false;
    menu.hidden = false;
    void overlay.offsetWidth;
    overlay.classList.add("open");
    menu.classList.add("open");
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "关闭菜单");
    document.body.classList.add("menu-open");
  }

  function closeMenu() {
    if (!burger || !overlay || !menu) return;
    clearTimeout(menuTimer);
    overlay.classList.remove("open");
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "打开菜单");
    document.body.classList.remove("menu-open");
    menuTimer = window.setTimeout(() => {
      if (!overlay.classList.contains("open")) {
        overlay.hidden = true;
        menu.hidden = true;
      }
    }, 320);
  }

  if (burger) {
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      open ? closeMenu() : openMenu();
    });
  }
  if (overlay) overlay.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) closeMenu();
  });
  if (menu) $$("a", menu).forEach((a) => a.addEventListener("click", closeMenu));

  /* ---------------- scroll spy ---------------- */
  const navLinks = $$(".nav-link");
  const mmLinks = $$(".mm-link");
  const sections = [
    { id: "top", key: "top" },
    { id: "works", key: "works" },
    { id: "connect", key: "connect" },
  ];

  function setActive(key) {
    navLinks.forEach((a) => a.classList.toggle("is-active", a.dataset.nav === key));
    mmLinks.forEach((a) => {
      const on = a.dataset.nav === key;
      a.classList.toggle("is-active", on);
      let dots = a.querySelector(".mm-dots");
      if (on && !dots) {
        dots = document.createElement("span");
        dots.className = "mm-dots";
        a.appendChild(dots);
      }
      if (!on && dots) dots.remove();
    });
  }

  let spyTick = false;
  function spy() {
    spyTick = false;
    const probe = window.innerHeight * 0.35;
    let current = "top";
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el && el.getBoundingClientRect().top <= probe) current = s.key;
    }
    setActive(current);
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!spyTick) {
        spyTick = true;
        requestAnimationFrame(spy);
      }
    },
    { passive: true }
  );
  spy();

  /* ============================================================
     works 数据（works-data.js → window.WORKS）
     ============================================================ */
  const CAT_ARTICLE = "文章";
  const CAT_VIDEO = "视频";
  const CAT_ICON = { [CAT_ARTICLE]: "fa-newspaper", [CAT_VIDEO]: "fa-circle-play" };

  const rawWorks = Array.isArray(window.WORKS) ? window.WORKS : [];
  const works = rawWorks
    .map((w) => ({
      title: String(w.title || "").trim().slice(0, 30),
      link: String(w.link || "").trim(),
      desc: String(w.desc || "").trim(),
      keywords: (Array.isArray(w.keywords) ? w.keywords : [])
        .map((k) => String(k).trim())
        .filter(Boolean)
        .slice(0, 5),
      category: w.category === CAT_VIDEO ? CAT_VIDEO : CAT_ARTICLE,
    }))
    .filter((w) => w.title);

  /* ---------------- 实时统计 ---------------- */
  const total = works.length;
  const nArticle = works.filter((w) => w.category === CAT_ARTICLE).length;
  const nVideo = total - nArticle;
  const nPlatform = $$(".connect-card").length || 2; // B站 + 公众号
  const statMap = { total, article: nArticle, video: nVideo, platform: nPlatform };
  $$("[data-stat]").forEach((el) => {
    const v = statMap[el.dataset.stat] ?? 0;
    el.dataset.count = String(v);
    el.textContent = String(v);
  });

  /* ---------------- count-up ---------------- */
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function runCount(el, index) {
    const target = parseFloat(el.dataset.count || "0");
    const suffix = el.dataset.suffix || "";
    if (reduced) {
      el.textContent = target + suffix;
      return;
    }
    const duration = 1500 + index * 80;
    const offset = 480 + index * 90;
    el.textContent = "0" + suffix;
    window.setTimeout(() => {
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min((now - t0) / duration, 1);
        el.textContent = Math.round(target * easeOutCubic(p)) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(step);
    }, offset);
  }

  const values = $$("[data-count]");
  if (values.length) {
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target;
              io.unobserve(el);
              runCount(el, values.indexOf(el));
            }
          });
        },
        { threshold: 0.25 }
      );
      values.forEach((el) => io.observe(el));
    } else {
      values.forEach(runCount);
    }
  }

  /* ---------------- reveal on scroll ---------------- */
  const revealEls = $$(".r");
  if (revealEls.length) {
    if ("IntersectionObserver" in window && !reduced) {
      const ro = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              ro.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
      );
      revealEls.forEach((el) => ro.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add("in"));
    }
  }

  /* ============================================================
     高亮联动中心：星图前置星 <-> 卡片
     ============================================================ */
  let activeIdx = -1;
  let sphereHover = -1; // 卡片悬停时临时点亮对应星星

  function syncActive(idx) {
    if (idx === activeIdx) return;
    activeIdx = idx;
    $$(".work-card").forEach((c) =>
      c.classList.toggle("is-active", Number(c.dataset.index) === idx)
    );
  }

  function pulseCard(idx) {
    $$(".work-card[data-index='" + idx + "']").forEach((c) => {
      c.classList.remove("pulse");
      void c.offsetWidth;
      c.classList.add("pulse");
      setTimeout(() => c.classList.remove("pulse"), 800);
    });
  }

  /* ============================================================
     球形星图：Fibonacci 球面分布 + 自转 + 拖拽 + 前置星高亮
     ============================================================ */
  const sphereCanvas = $("#sphere");
  let sphereFront = 0;

  if (sphereCanvas && total > 0) {
    const sctx = sphereCanvas.getContext("2d");
    const swrap = sphereCanvas.parentElement;

    // --- 球面点 ---
    const N = total;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const pts = [];
    for (let i = 0; i < N; i++) {
      const y = N === 1 ? 0 : 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i * golden;
      pts.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
    }

    // --- 星座连线：近邻对，数量截断防大集合爆炸 ---
    let pairs = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const dz = pts[i].z - pts[j].z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 0.38) pairs.push([i, j, d2]);
      }
    }
    pairs.sort((a, b) => a[2] - b[2]);
    pairs = pairs.slice(0, Math.max(N * 2, 6));

    // --- 尘埃 ---
    const dust = [];
    for (let i = 0; i < 70; i++) {
      dust.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.5 + Math.random() * 1.3,
        phase: Math.random() * Math.PI * 2,
        tw: 0.3 + Math.random() * 0.7,
      });
    }

    // --- 星云云雾（背景层，缓慢漂移+呼吸） ---
    const clouds = [
      { x: 0.28, y: 0.3, r: 0.52, hue: [67, 56, 202], phase: 0.0, spd: 0.05, a: 0.17 },
      { x: 0.72, y: 0.66, r: 0.58, hue: [29, 78, 216], phase: 2.1, spd: 0.04, a: 0.15 },
      { x: 0.52, y: 0.2, r: 0.42, hue: [110, 72, 200], phase: 4.2, spd: 0.06, a: 0.11 },
    ];

    // --- 远景星空（拖动球体时反向慢移，制造视差） ---
    const farStars = [];
    for (let i = 0; i < 90; i++) {
      farStars.push({
        fx: Math.random(),
        fy: Math.random(),
        big: Math.random() > 0.82,
        depth: 0.15 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // --- 轨道环 + 像素小卫星 ---
    const orbits = [
      { tiltX: 1.15, tiltZ: 0.35, rad: 1.26, a: 0.16, period: 16 },
      { tiltX: 1.9, tiltZ: -0.5, rad: 1.52, a: 0.09, period: 27 },
    ];

    function orbitPoint(o, th) {
      const x = Math.cos(th) * o.rad;
      const z = Math.sin(th) * o.rad;
      const x1 = x * Math.cos(o.tiltZ);
      const y1 = x * Math.sin(o.tiltZ);
      const y2 = y1 * Math.cos(o.tiltX) - z * Math.sin(o.tiltX);
      const z2 = y1 * Math.sin(o.tiltX) + z * Math.cos(o.tiltX);
      const s = FOCAL / (CAM - z2);
      return { x: cx + x1 * R * s, y: cy + y2 * R * s, z: z2, s };
    }

    let W = 0, H = 0, dpr = 1, R = 100, cx = 0, cy = 0;
    let ry = 0.6, rx = -0.28;        // 旋转角（Y 自转 + X 俯仰）
    let vy = 0, vx = 0;              // 惯性速度
    let dragging = false;
    let moved = 0;
    let lastX = 0, lastY = 0, lastT = 0;
    let lastProj = [];
    let raf = 0, lastTime = 0;
    let running = false;
    const AUTO_SPEED = 0.28;         // rad/s 自转
    const CAM = 2.6;                 // 相机距离（球半径单位）
    const FOCAL = 2.4;

    function resize() {
      const rect = swrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(rect.width, 1);
      H = Math.max(rect.height, 1);
      sphereCanvas.width = Math.round(W * dpr);
      sphereCanvas.height = Math.round(H * dpr);
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.min(W, H) * 0.3;
      cx = W / 2;
      cy = H / 2;
    }

    let cosX = 1, sinX = 0, cosY = 1, sinY = 0;
    function updateRot() {
      cosX = Math.cos(rx); sinX = Math.sin(rx);
      cosY = Math.cos(ry); sinY = Math.sin(ry);
    }
    function projPoint(p) {
      const y1 = p.y * cosX - p.z * sinX;
      const z1 = p.y * sinX + p.z * cosX;
      const x2 = p.x * cosY + z1 * sinY;
      const z2 = -p.x * sinY + z1 * cosY;
      const s = FOCAL / (CAM - z2);
      return { x: cx + x2 * R * s, y: cy + y1 * R * s, z: z2, s };
    }
    function project() {
      updateRot();
      lastProj = pts.map((p, i) => Object.assign(projPoint(p), { i }));
    }

    function draw(now) {
      const t = now / 1000;
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
      lastTime = now;

      if (!dragging) {
        if (!reduced) {
          ry += (AUTO_SPEED + vy) * dt;
          rx += vx * dt;
          const decay = Math.exp(-2.2 * dt);
          vy *= decay;
          vx *= decay;
        }
        rx = Math.max(-1.0, Math.min(0.45, rx));
      }

      project();

      // 前置星 = z 最大（最靠近观众）
      let front = 0;
      for (const q of lastProj) if (q.z > lastProj[front].z) front = q.i;
      sphereFront = front;

      sctx.clearRect(0, 0, W, H);
      const silR = (R * FOCAL) / Math.sqrt(CAM * CAM - 1); // 球剪影屏幕半径

      // 星云云雾
      for (const c of clouds) {
        const dx = reduced ? 0 : Math.sin(t * c.spd + c.phase) * 0.06;
        const dy = reduced ? 0 : Math.cos(t * c.spd * 0.8 + c.phase) * 0.05;
        const px = (c.x + dx) * W;
        const py = (c.y + dy) * H;
        const pr = c.r * Math.min(W, H) * (reduced ? 1 : 1 + 0.04 * Math.sin(t * 0.3 + c.phase));
        const g = sctx.createRadialGradient(px, py, 0, px, py, pr);
        g.addColorStop(0, "rgba(" + c.hue.join(",") + "," + c.a + ")");
        g.addColorStop(1, "rgba(" + c.hue.join(",") + ",0)");
        sctx.fillStyle = g;
        sctx.beginPath();
        sctx.arc(px, py, pr, 0, Math.PI * 2);
        sctx.fill();
      }

      // 远景星空（视差层）
      const pOff = ry * 70;
      for (const f of farStars) {
        let sx = (f.fx * W + pOff * f.depth) % W;
        if (sx < 0) sx += W;
        const tw = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t * (0.4 + f.depth) * 4 + f.phase);
        sctx.fillStyle = "rgba(190, 205, 255, " + (0.12 + 0.24 * tw) + ")";
        const sz = f.big ? 2 : 1;
        sctx.fillRect(Math.round(sx), Math.round(f.fy * H), sz, sz);
      }

      // 大气边缘辉光
      const rimB = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.8);
      const rim = sctx.createRadialGradient(cx, cy, silR * 0.8, cx, cy, silR * 1.2);
      rim.addColorStop(0, "rgba(90, 120, 255, 0)");
      rim.addColorStop(0.5, "rgba(110, 140, 255, " + (0.09 + 0.05 * rimB) + ")");
      rim.addColorStop(1, "rgba(90, 120, 255, 0)");
      sctx.fillStyle = rim;
      sctx.beginPath();
      sctx.arc(cx, cy, silR * 1.2, 0, Math.PI * 2);
      sctx.fill();

      // 尘埃
      for (const p of dust) {
        const a = 0.12 + 0.2 * (0.5 + 0.5 * Math.sin(t * p.tw + p.phase));
        sctx.beginPath();
        sctx.fillStyle = "rgba(180, 196, 255, " + a + ")";
        sctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        sctx.fill();
      }

      // 经纬骨架（背面弧线被球体遮挡）
      const onSphere = (q) => !(q.z < 0 && (q.x - cx) ** 2 + (q.y - cy) ** 2 < silR * silR * 0.97);
      for (let m = 0; m < 8; m++) {
        const phi = (m * Math.PI) / 4;
        sctx.beginPath();
        let pen = false;
        for (let k = 0; k <= 36; k++) {
          const th = (k / 36) * Math.PI;
          const q = projPoint({
            x: Math.sin(th) * Math.cos(phi),
            y: Math.cos(th),
            z: Math.sin(th) * Math.sin(phi),
          });
          if (onSphere(q)) {
            if (!pen) { sctx.moveTo(q.x, q.y); pen = true; }
            else sctx.lineTo(q.x, q.y);
          } else pen = false;
        }
        sctx.strokeStyle = "rgba(122, 143, 255, 0.08)";
        sctx.lineWidth = 1;
        sctx.stroke();
      }
      const latSet = [[0, 0.12], [0.5, 0.09], [-0.5, 0.09], [0.85, 0.07], [-0.85, 0.07]];
      for (const [ly, la] of latSet) {
        const lr = Math.sqrt(Math.max(0, 1 - ly * ly));
        sctx.beginPath();
        let pen = false;
        for (let k = 0; k <= 48; k++) {
          const th = (k / 48) * Math.PI * 2;
          const q = projPoint({ x: Math.cos(th) * lr, y: ly, z: Math.sin(th) * lr });
          if (onSphere(q)) {
            if (!pen) { sctx.moveTo(q.x, q.y); pen = true; }
            else sctx.lineTo(q.x, q.y);
          } else pen = false;
        }
        sctx.strokeStyle = "rgba(122, 143, 255, " + la + ")";
        sctx.lineWidth = 1;
        sctx.stroke();
      }

      // 连线（按 z 排序后画，近处更亮）
      for (const [i, j] of pairs) {
        const a = lastProj[i], b = lastProj[j];
        const zAvg = (a.z + b.z) / 2;
        const k = (zAvg + 1) / 2;
        sctx.strokeStyle = "rgba(122, 143, 255, " + (0.06 + 0.22 * k) + ")";
        sctx.lineWidth = 0.6 + 0.8 * k;
        sctx.beginPath();
        sctx.moveTo(a.x, a.y);
        sctx.lineTo(b.x, b.y);
        sctx.stroke();
      }

      // 星星：远→近
      const order = lastProj.slice().sort((a, b) => a.z - b.z);
      const act = sphereHover >= 0 ? sphereHover : front;
      for (const q of order) {
        const k = (q.z + 1) / 2;                    // 0远 1近
        const on = q.i === act;
        const breathe = reduced ? 0 : Math.sin(t * 1.6 + q.i) * 0.5 + 0.5;
        const rad = (on ? 5.2 + breathe * 1.2 : 2.2 + 2.6 * k) * q.s;

        const g = sctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, rad * 4.6);
        if (on) {
          g.addColorStop(0, "rgba(170, 186, 255, 0.95)");
          g.addColorStop(0.35, "rgba(90, 118, 255, 0.45)");
          g.addColorStop(1, "rgba(67, 56, 202, 0)");
        } else {
          g.addColorStop(0, "rgba(150, 168, 255, " + (0.3 + 0.45 * k) + ")");
          g.addColorStop(0.4, "rgba(70, 96, 220, " + (0.1 + 0.15 * k) + ")");
          g.addColorStop(1, "rgba(29, 78, 216, 0)");
        }
        sctx.fillStyle = g;
        sctx.beginPath();
        sctx.arc(q.x, q.y, rad * 4.6, 0, Math.PI * 2);
        sctx.fill();

        sctx.beginPath();
        sctx.fillStyle = on ? "#ffffff" : "rgba(216, 226, 255, " + (0.5 + 0.45 * k) + ")";
        sctx.arc(q.x, q.y, rad, 0, Math.PI * 2);
        sctx.fill();

        if (on) {
          sctx.font = '500 12px "Inter", "Segoe UI", sans-serif';
          sctx.fillStyle = "rgba(255, 255, 255, 0.92)";
          sctx.textAlign = "center";
          sctx.fillText(works[q.i].title, q.x, q.y + rad + 18);
        }
      }

      // 轨道环 + 像素小卫星（球体前方的弧段压在星点之上，背面被遮挡）
      for (const o of orbits) {
        sctx.beginPath();
        let pen = false;
        for (let k = 0; k <= 72; k++) {
          const q = orbitPoint(o, (k / 72) * Math.PI * 2);
          const hidden = q.z < 0 && (q.x - cx) ** 2 + (q.y - cy) ** 2 < silR * silR;
          if (hidden) { pen = false; continue; }
          if (!pen) { sctx.moveTo(q.x, q.y); pen = true; }
          else sctx.lineTo(q.x, q.y);
        }
        sctx.strokeStyle = "rgba(130, 160, 255, " + o.a + ")";
        sctx.lineWidth = 1;
        sctx.stroke();

        const th = reduced ? 1.2 : (t / o.period) * Math.PI * 2;
        const sq = orbitPoint(o, th);
        const occluded = sq.z < 0 && (sq.x - cx) ** 2 + (sq.y - cy) ** 2 < silR * silR;
        if (!occluded) {
          const sg = sctx.createRadialGradient(sq.x, sq.y, 0, sq.x, sq.y, 7 * sq.s);
          sg.addColorStop(0, "rgba(195, 212, 255, 0.85)");
          sg.addColorStop(1, "rgba(120, 150, 255, 0)");
          sctx.fillStyle = sg;
          sctx.beginPath();
          sctx.arc(sq.x, sq.y, 7 * sq.s, 0, Math.PI * 2);
          sctx.fill();
          sctx.fillStyle = "#fff";
          sctx.fillRect(Math.round(sq.x) - 1, Math.round(sq.y) - 1, 3, 3);
        }
      }

      // 前置星像素瞄准框（跟随当前高亮的星）
      const fq = lastProj[act];
      if (fq) {
        const br = reduced ? 0 : Math.sin(t * 2.4) * 1.5;
        const gap = Math.round(10 + br);
        const arm = 6;
        const ax = Math.round(fq.x);
        const ay = Math.round(fq.y);
        sctx.fillStyle = "rgba(140, 168, 255, 0.9)";
        for (const [skx, sky] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const bx = ax + skx * gap;
          const by = ay + sky * gap;
          // 横臂
          sctx.fillRect(skx < 0 ? bx - arm + 1 : bx - 1, sky < 0 ? by - 1 : by - 1, arm + 1, 2);
          // 竖臂
          sctx.fillRect(skx < 0 ? bx - 1 : bx - 1, sky < 0 ? by - arm + 1 : by - 1, 2, arm + 1);
        }
      }

      syncActive(act);

      if (running && !reduced) raf = requestAnimationFrame(draw);
    }

    function start() {
      if (running) return;
      running = true;
      lastTime = 0;
      raf = requestAnimationFrame(draw);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }
    function renderOnce() {
      lastTime = 0;
      draw(performance.now());
    }

    // --- 拖拽旋转（惯性释放） ---
    sphereCanvas.addEventListener("pointerdown", (e) => {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = performance.now();
      vy = 0;
      vx = 0;
      sphereCanvas.classList.add("dragging");
      sphereCanvas.setPointerCapture(e.pointerId);
    });
    sphereCanvas.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dt = Math.max((now - lastT) / 1000, 0.008);
      moved += Math.abs(dx) + Math.abs(dy);
      ry += dx * 0.005;
      rx = Math.max(-1.0, Math.min(0.45, rx + dy * 0.004));
      vy = (dx * 0.005) / dt * 0.35;   // 释放后延续的角速度
      vx = (dy * 0.004) / dt * 0.25;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;
      if (reduced) renderOnce();
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      sphereCanvas.classList.remove("dragging");
      try { sphereCanvas.releasePointerCapture(e.pointerId); } catch (_) {}
      if (reduced) {
        vy = 0;
        vx = 0;
        renderOnce();
      }
    }
    sphereCanvas.addEventListener("pointerup", endDrag);
    sphereCanvas.addEventListener("pointercancel", endDrag);

    // --- 点击星星 → 高亮对应卡片并直接打开链接 ---
    sphereCanvas.addEventListener("click", (e) => {
      if (moved > 6) return; // 拖拽过，不算点击
      const rect = sphereCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // 命中半径内取最靠前（z 最大）的那颗星
      let best = -1, bestZ = -Infinity;
      for (const q of lastProj) {
        const d = (q.x - x) ** 2 + (q.y - y) ** 2;
        if (d < 26 * 26 && q.z > bestZ) {
          bestZ = q.z;
          best = q.i;
        }
      }
      if (best >= 0) {
        syncActive(best);
        pulseCard(best);
        const w = works[best];
        if (w && w.link) window.open(w.link, "_blank", "noopener");
      }
    });

    const sro = "ResizeObserver" in window
      ? new ResizeObserver(() => { resize(); if (reduced) renderOnce(); })
      : null;
    if (sro) sro.observe(swrap);
    else window.addEventListener("resize", () => { resize(); if (reduced) renderOnce(); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) start();
            else stop();
          });
        },
        { threshold: 0.05 }
      ).observe(swrap);
    } else {
      start();
    }

    resize();
    if (reduced) renderOnce();
    else start();
  } else if (sphereCanvas) {
    // 没有作品时给个提示
    const sctx = sphereCanvas.getContext("2d");
    const paint = () => {
      const rect = sphereCanvas.parentElement.getBoundingClientRect();
      sphereCanvas.width = rect.width;
      sphereCanvas.height = rect.height;
      sctx.fillStyle = "rgba(255,255,255,0.4)";
      sctx.font = '400 14px "Inter", sans-serif';
      sctx.textAlign = "center";
      sctx.fillText("作品集准备中，第一颗星星很快点亮", rect.width / 2, rect.height / 2);
    };
    paint();
    window.addEventListener("resize", paint);
  }

  /* ============================================================
     三行交错滚动卡片（自动 + 手动拖拽）
     ============================================================ */
  const marquee = $("#cardsMarquee");

  function makeCard(w, i) {
    const card = document.createElement("article");
    card.className = "work-card" + (w.link ? "" : " no-link");
    card.dataset.index = String(i);

    const head = document.createElement("div");
    head.className = "wc-head";
    const h3 = document.createElement("h3");
    h3.textContent = w.title;
    const cat = document.createElement("span");
    cat.className = "work-cat " + (w.category === CAT_VIDEO ? "cat-video" : "cat-article");
    cat.innerHTML = '<i class="fa-solid ' + CAT_ICON[w.category] + '"></i>' + w.category;
    head.append(h3, cat);

    card.appendChild(head);
    if (w.desc) {
      const p = document.createElement("p");
      p.textContent = w.desc;
      card.appendChild(p);
    }
    if (w.keywords.length) {
      const tags = document.createElement("div");
      tags.className = "work-tags";
      w.keywords.forEach((k) => {
        const s = document.createElement("span");
        s.textContent = k;
        tags.appendChild(s);
      });
      card.appendChild(tags);
    }
    const go = document.createElement("span");
    go.className = "wc-go";
    go.innerHTML = w.link
      ? '阅读全文 <i class="fa-solid fa-arrow-right"></i>'
      : "链接待填";
    card.appendChild(go);
    return card;
  }

  if (marquee) {
    const rows = $$(".marquee-row", marquee);

    if (!works.length) {
      const empty = document.createElement("div");
      empty.className = "work-card no-link";
      empty.style.margin = "0 auto";
      empty.innerHTML = "<h3>作品集准备中</h3><p>先去公众号逛逛？</p>";
      marquee.innerHTML = "";
      marquee.appendChild(empty);
    } else {
      const rowItems = rows.map(() => []);
      works.forEach((w, i) => rowItems[i % rows.length].push([w, i]));

      const rowStates = [];
      rows.forEach((row, r) => {
        const track = $(".marquee-track", row);
        const items = rowItems[r];
        if (!items.length) {
          row.style.display = "none";
          rowStates.push(null);
          return;
        }
        items.forEach(([w, i]) => track.appendChild(makeCard(w, i)));
        // 复制一份实现无缝循环
        const clones = Array.from(track.children).map((c) => {
          const cl = c.cloneNode(true);
          cl.dataset.clone = "1";
          return cl;
        });
        clones.forEach((cl) => track.appendChild(cl));

        rowStates.push({
          row,
          track,
          pos: -Math.random() * 160,
          dir: Number(row.dataset.dir) || -1,
          speed: 38,
          vel: 0,
          dragging: false,
          hover: false,
          half: 0,
          lastX: 0,
          lastT: 0,
        });
      });

      function measure() {
        rowStates.forEach((st) => {
          if (st) st.half = st.track.scrollWidth / 2;
        });
      }
      measure();
      window.addEventListener("resize", measure);
      if ("ResizeObserver" in window) {
        const mro = new ResizeObserver(measure);
        rowStates.forEach((st) => st && mro.observe(st.track));
      }

      // 拖拽 / 悬停暂停 / 点击跳转 / 悬停联动星图
      rowStates.forEach((st) => {
        if (!st) return;
        const { track } = st;

        track.addEventListener("pointerdown", (e) => {
          st.dragging = true;
          st.moved = 0;
          st.lastX = e.clientX;
          st.lastT = performance.now();
          st.vel = 0;
          track.classList.add("dragging");
          track.setPointerCapture(e.pointerId);
        });
        track.addEventListener("pointermove", (e) => {
          if (!st.dragging) return;
          const now = performance.now();
          const dx = e.clientX - st.lastX;
          const dt = Math.max((now - st.lastT) / 1000, 0.008);
          st.moved += Math.abs(dx);
          st.pos += dx;
          st.vel = (dx / dt) * 0.35;
          st.lastX = e.clientX;
          st.lastT = now;
        });
        const end = (e) => {
          if (!st.dragging) return;
          st.dragging = false;
          track.classList.remove("dragging");
          try { track.releasePointerCapture(e.pointerId); } catch (_) {}
          if (reduced) st.vel = 0;
        };
        track.addEventListener("pointerup", end);
        track.addEventListener("pointercancel", end);

        st.row.addEventListener("pointerenter", () => { st.hover = true; });
        st.row.addEventListener("pointerleave", () => {
          st.hover = false;
          if (sphereHover >= 0) {
            sphereHover = -1;
          }
        });

        // 卡片悬停 → 星图对应星星点亮；点击 → 跳链接
        track.addEventListener("pointerover", (e) => {
          const card = e.target.closest(".work-card");
          if (card && !card.dataset.clone) {
            sphereHover = Number(card.dataset.index);
            if (reduced) { /* 静态模式下星图由拖拽重绘 */ }
          }
        });
        track.addEventListener("click", (e) => {
          // setPointerCapture 会把 click 的 target 改写成 track 本身，
          // e.target 不可信——用坐标反查真实卡片
          const hit = document.elementFromPoint(e.clientX, e.clientY);
          const card = hit && hit.closest(".work-card");
          if (!card || st.moved > 6) return;
          const idx = Number(card.dataset.index);
          const w = works[idx];
          if (w && w.link) window.open(w.link, "_blank", "noopener");
        });
      });

      // 单一 rAF 驱动三行
      let mLast = 0;
      function mFrame(now) {
        const dt = mLast ? Math.min((now - mLast) / 1000, 0.05) : 0.016;
        mLast = now;
        rowStates.forEach((st) => {
          if (!st || !st.half) return;
          if (!st.dragging) {
            if (!reduced && !st.hover) st.pos += st.dir * st.speed * dt;
            st.pos += st.vel * dt;
            st.vel *= Math.exp(-(st.hover ? 6 : 2.2) * dt);
          }
          // 环形回绕
          while (st.pos <= -st.half) st.pos += st.half;
          while (st.pos > 0) st.pos -= st.half;
          st.track.style.transform = "translate3d(" + st.pos + "px,0,0)";
        });
        requestAnimationFrame(mFrame);
      }
      requestAnimationFrame(mFrame);
    }
  }
})();
