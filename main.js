/* ============================================================
   Bon 个人主页 — main.js
   移动端菜单 / 滚动入场 / 数字滚动 / 作品集(数据驱动) / 星云画布
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
    void overlay.offsetWidth; // reflow，保证过渡播放
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

  /* ---------------- count-up stats ---------------- */
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function runCount(el, index) {
    const target = parseFloat(el.dataset.count || "0");
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const fmt = (v) => v.toFixed(decimals) + suffix;

    if (reduced) {
      el.textContent = fmt(target);
      return;
    }
    const duration = 1500 + index * 80;
    const offset = 480 + index * 90;
    el.textContent = fmt(0);
    window.setTimeout(() => {
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min((now - t0) / duration, 1);
        el.textContent = fmt(target * easeOutCubic(p));
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = fmt(target);
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
        { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
      );
      revealEls.forEach((el) => ro.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add("in"));
    }
  }

  /* ============================================================
     works —— 数据来自 works-data.js 的 window.WORKS
     字段：title(≤30字) / link / desc / keywords(≤5) / category(文章|视频)
     ============================================================ */
  const CAT_ARTICLE = "文章";
  const CAT_VIDEO = "视频";
  const CAT_ICON = { [CAT_ARTICLE]: "fa-newspaper", [CAT_VIDEO]: "fa-circle-play" };

  // 归一化：去空白、截断规则外内容，脏数据不炸页面
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

  const worksList = $("#worksList");
  const canvas = $("#nebula");
  const tip = $("#nebulaTip");

  if (worksList) {
    if (!works.length) {
      const li = document.createElement("li");
      li.className = "work-empty";
      li.textContent = "作品集准备中，先去公众号逛逛？";
      worksList.appendChild(li);
    } else {
      works.forEach((w, i) => {
        const li = document.createElement("li");
        li.className = "work-item r";
        li.dataset.work = String(i);
        li.style.setProperty("--d", `${0.05 + Math.min(i, 8) * 0.05}s`);
        li.tabIndex = 0;
        if (!w.link) {
          li.classList.add("no-link");
          li.setAttribute("aria-disabled", "true");
        }

        const idx = document.createElement("span");
        idx.className = "work-idx";
        idx.textContent = String(i + 1).padStart(2, "0");

        const body = document.createElement("div");
        body.className = "work-body";

        const head = document.createElement("div");
        head.className = "work-head";
        const h3 = document.createElement("h3");
        h3.textContent = w.title;
        const cat = document.createElement("span");
        cat.className = `work-cat cat-${w.category === CAT_VIDEO ? "video" : "article"}`;
        cat.innerHTML = `<i class="fa-solid ${CAT_ICON[w.category]}"></i>${w.category}`;
        head.append(h3, cat);

        body.appendChild(head);
        if (w.desc) {
          const p = document.createElement("p");
          p.textContent = w.desc;
          body.appendChild(p);
        }
        if (w.keywords.length) {
          const tags = document.createElement("div");
          tags.className = "work-tags";
          w.keywords.forEach((k) => {
            const s = document.createElement("span");
            s.textContent = k;
            tags.appendChild(s);
          });
          body.appendChild(tags);
        }

        li.append(idx, body);

        // 点击 = 直接跳转填入的链接（新标签页）
        const open = () => {
          if (w.link) window.open(w.link, "_blank", "noopener");
        };
        li.addEventListener("click", open);
        li.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        });

        // 悬停 = 点亮星云
        li.addEventListener("pointerenter", () => {
          hover = i;
          if (reduced) renderOnce();
        });
        li.addEventListener("pointerleave", () => {
          hover = -1;
          if (reduced) renderOnce();
        });

        worksList.appendChild(li);
      });

      // 动态加入的 .r 也要走入场动画
      const newReveals = $$(".work-item.r", worksList);
      if ("IntersectionObserver" in window && !reduced) {
        const ro2 = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("in");
                ro2.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.15 }
        );
        newReveals.forEach((el) => ro2.observe(el));
      } else {
        newReveals.forEach((el) => el.classList.add("in"));
      }
    }
  }

  /* ---------------- nebula ---------------- */
  const workItems = $$(".work-item");
  let active = -1;
  let hover = -1;

  if (canvas && workItems.length) {
    const ctx = canvas.getContext("2d");
    const wrap = canvas.parentElement;
    const labels = works.map((w) => w.title);
    const isVideo = works.map((w) => w.category === CAT_VIDEO);

    const mulberry32 = (a) => () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const rand = mulberry32(20260930);

    const NODES = workItems.length;
    const DUST = 110;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let nodes = [];
    let dust = [];
    let links = [];
    let raf = 0;
    let running = false;

    function layout() {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(rect.width, 1);
      H = Math.max(rect.height, 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = NODES <= 4 ? 2 : NODES <= 9 ? 3 : 4;
      const rows = Math.ceil(NODES / cols);
      const padX = W * 0.12;
      const padY = H * 0.14;
      const cellW = (W - padX * 2) / cols;
      const cellH = (H - padY * 2) / rows;
      nodes = [];
      for (let i = 0; i < NODES; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        nodes.push({
          x: padX + cellW * (c + 0.5) + (rand() - 0.5) * cellW * 0.55,
          y: padY + cellH * (r + 0.5) + (rand() - 0.5) * cellH * 0.55,
          phase: rand() * Math.PI * 2,
          speed: 0.4 + rand() * 0.5,
          size: 3 + rand() * 2.4,
        });
      }

      dust = [];
      for (let i = 0; i < DUST; i++) {
        dust.push({
          x: rand() * W,
          y: rand() * H,
          r: 0.5 + rand() * 1.4,
          phase: rand() * Math.PI * 2,
          tw: 0.3 + rand() * 0.7,
        });
      }

      links = [];
      nodes.forEach((n, i) => {
        const dist = nodes
          .map((m, j) => ({ j, d: (m.x - n.x) ** 2 + (m.y - n.y) ** 2 }))
          .filter((e) => e.j !== i)
          .sort((a, b) => a.d - b.d)
          .slice(0, 2);
        dist.forEach((e) => {
          if (i < e.j) links.push([i, e.j]);
        });
      });
    }

    // 节点配色：文章=蓝紫，视频=青蓝
    function nodeColor(i, on) {
      if (isVideo[i]) return on ? "rgba(140, 214, 255," : "rgba(110, 200, 255,";
      return on ? "rgba(160, 178, 255," : "rgba(122, 143, 255,";
    }

    function draw(time) {
      const t = time / 1000;
      ctx.clearRect(0, 0, W, H);

      for (const p of dust) {
        const a = 0.14 + 0.22 * (0.5 + 0.5 * Math.sin(t * p.tw + p.phase));
        ctx.beginPath();
        ctx.fillStyle = `rgba(180, 196, 255, ${a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      links.forEach(([a, b]) => {
        const na = nodes[a];
        const nb = nodes[b];
        const hot = a === active || b === active || a === hover || b === hover;
        ctx.strokeStyle = hot ? "rgba(122, 143, 255, 0.42)" : "rgba(122, 143, 255, 0.12)";
        ctx.lineWidth = hot ? 1.2 : 0.8;
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.stroke();
      });

      nodes.forEach((n, i) => {
        const on = i === active || i === hover;
        const breathe = reduced ? 0 : Math.sin(t * n.speed + n.phase) * 0.5 + 0.5;
        const rad = n.size * (on ? 1.9 + breathe * 0.5 : 1 + breathe * 0.18);

        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, rad * 5.2);
        if (on) {
          g.addColorStop(0, nodeColor(i, true) + " 0.9)");
          g.addColorStop(0.35, nodeColor(i, true) + " 0.4)");
          g.addColorStop(1, "rgba(67, 56, 202, 0)");
        } else {
          g.addColorStop(0, nodeColor(i, false) + " 0.55)");
          g.addColorStop(0.4, nodeColor(i, false) + " 0.2)");
          g.addColorStop(1, "rgba(29, 78, 216, 0)");
        }
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, rad * 5.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = on ? "#ffffff" : "rgba(214, 224, 255, 0.92)";
        ctx.arc(n.x, n.y, rad, 0, Math.PI * 2);
        ctx.fill();

        if (on) {
          ctx.font = '500 12px "Inter", "Segoe UI", sans-serif';
          ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
          ctx.textAlign = "center";
          ctx.fillText(labels[i], n.x, n.y + rad + 18);
        }
      });
    }

    function frame(time) {
      draw(time);
      if (running && !reduced) raf = requestAnimationFrame(frame);
    }
    function start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }
    function renderOnce() {
      draw(performance.now());
    }

    function syncList(index) {
      workItems.forEach((li, i) => li.classList.toggle("is-active", i === index));
    }

    function select(index) {
      active = index;
      syncList(index);
      if (reduced) renderOnce();
    }

    function nodeAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      let best = -1;
      let bestD = 30 * 30;
      nodes.forEach((n, i) => {
        const d = (n.x - x) ** 2 + (n.y - y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return { index: best, x, y };
    }

    canvas.addEventListener("pointermove", (e) => {
      const hit = nodeAt(e.clientX, e.clientY);
      if (hit.index !== hover) {
        hover = hit.index;
        canvas.style.cursor = hover >= 0 ? "pointer" : "default";
        syncList(hover);
        if (reduced) renderOnce();
      }
      if (tip) {
        if (hover >= 0) {
          tip.hidden = false;
          tip.textContent = labels[hover];
          tip.style.left = hit.x + "px";
          tip.style.top = hit.y + "px";
        } else {
          tip.hidden = true;
        }
      }
    });

    canvas.addEventListener("pointerleave", () => {
      hover = -1;
      canvas.style.cursor = "default";
      if (tip) tip.hidden = true;
      syncList(active);
      if (reduced) renderOnce();
    });

    // 点星星 = 跳对应链接
    canvas.addEventListener("click", (e) => {
      const hit = nodeAt(e.clientX, e.clientY);
      if (hit.index >= 0 && works[hit.index] && works[hit.index].link) {
        window.open(works[hit.index].link, "_blank", "noopener");
      }
    });

    const ro3 = "ResizeObserver" in window
      ? new ResizeObserver(() => { layout(); if (reduced) renderOnce(); })
      : null;
    if (ro3) ro3.observe(wrap);
    else window.addEventListener("resize", () => { layout(); if (reduced) renderOnce(); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) start();
            else stop();
          });
        },
        { threshold: 0.05 }
      ).observe(wrap);
    } else {
      start();
    }

    layout();
    if (reduced) renderOnce();
    else start();
    select(0);
  }
})();
