/* ============================================================
   Bon 个人主页 — main.js
   菜单 / 入场动画 / 实时统计 / 便当盒最近更新 + 站内搜索 / 公众号二维码展开
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
  const nPlatform = $$(".connect-card").length || 3; // B站 + GitHub + 公众号
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
     便当盒（最近更新 6 张）+ 搜索结果（普通小卡片）
     ============================================================ */
  const grid = $("#bentoGrid");
  const results = $("#searchResults");
  const emptyBox = $("#bentoEmpty");
  const searchBox = $("#searchBox");
  const input = $("#worksSearch");
  const clearBtn = $("#searchClear");
  const metaLine = $("#searchMeta");
  const RECENT = 6;

  const tokensOf = (q) =>
    String(q || "")
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

  const hayOf = (w) =>
    [w.title, w.desc, w.category, ...(w.keywords || [])].join(" ").toLowerCase();

  const matchAll = (w, tokens) => tokens.every((t) => hayOf(w).includes(t));

  // 命中高亮：返回带 <mark> 的 DocumentFragment
  function highlight(text, tokens) {
    const frag = document.createDocumentFragment();
    if (!tokens.length) {
      frag.appendChild(document.createTextNode(text));
      return frag;
    }
    const lower = text.toLowerCase();
    const ranges = [];
    tokens.forEach((t) => {
      let from = 0;
      let i = lower.indexOf(t, from);
      while (i !== -1) {
        ranges.push([i, i + t.length]);
        from = i + t.length;
        i = lower.indexOf(t, from);
      }
    });
    if (!ranges.length) {
      frag.appendChild(document.createTextNode(text));
      return frag;
    }
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [ranges[0]];
    for (let k = 1; k < ranges.length; k++) {
      const last = merged[merged.length - 1];
      if (ranges[k][0] <= last[1]) last[1] = Math.max(last[1], ranges[k][1]);
      else merged.push(ranges[k]);
    }
    let pos = 0;
    merged.forEach(([s, e]) => {
      if (s > pos) frag.appendChild(document.createTextNode(text.slice(pos, s)));
      const mark = document.createElement("mark");
      mark.textContent = text.slice(s, e);
      frag.appendChild(mark);
      pos = e;
    });
    if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
    return frag;
  }

  /* ---------- 便当盒卡片（1 大 + 5 小） ---------- */
  function makeBentoCard(w, idx) {
    const card = document.createElement("a");
    card.className = "bento-card" + (idx === 0 ? " large" : "");
    card.href = w.link || "#";
    if (w.link) {
      card.target = "_blank";
      card.rel = "noopener";
    }
    card.style.setProperty("--i", String(Math.min(idx, 9)));

    const top = document.createElement("div");
    top.className = "bc-top";
    const cat = document.createElement("span");
    cat.className =
      "work-cat " + (w.category === CAT_VIDEO ? "cat-video" : "cat-article");
    cat.innerHTML =
      '<i class="fa-solid ' + CAT_ICON[w.category] + '"></i>' + w.category;
    const arrow = document.createElement("i");
    arrow.className = "fa-solid fa-arrow-up-right-from-square bc-arrow";
    top.append(cat, arrow);

    const h3 = document.createElement("h3");
    h3.textContent = w.title;
    card.append(top, h3);

    if (w.desc) {
      const p = document.createElement("p");
      p.textContent = w.desc;
      card.appendChild(p);
    }

    if (w.keywords.length) {
      const tags = document.createElement("div");
      tags.className = "bc-tags";
      w.keywords.forEach((k) => {
        const s = document.createElement("span");
        s.textContent = k;
        tags.appendChild(s);
      });
      card.appendChild(tags);
    }

    const go = document.createElement("span");
    go.className = "bc-go";
    go.textContent = w.category === CAT_VIDEO ? "观看视频" : "阅读原文";
    card.appendChild(go);

    return card;
  }

  /* ---------- 搜索结果小卡片（非便当盒） ---------- */
  function makeSearchCard(w, idx, tokens) {
    const card = document.createElement("a");
    card.className = "work-card" + (w.link ? "" : " no-link");
    card.href = w.link || "#";
    if (w.link) {
      card.target = "_blank";
      card.rel = "noopener";
    }
    card.style.setProperty("--i", String(Math.min(idx, 11)));

    const head = document.createElement("div");
    head.className = "wc-head";
    const h3 = document.createElement("h3");
    h3.appendChild(highlight(w.title, tokens));
    const cat = document.createElement("span");
    cat.className =
      "work-cat " + (w.category === CAT_VIDEO ? "cat-video" : "cat-article");
    cat.innerHTML =
      '<i class="fa-solid ' + CAT_ICON[w.category] + '"></i>' + w.category;
    head.append(h3, cat);
    card.appendChild(head);

    if (w.desc) {
      const p = document.createElement("p");
      p.appendChild(highlight(w.desc, tokens));
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
    go.textContent = w.category === CAT_VIDEO ? "观看视频" : "阅读原文";
    const goIcon = document.createElement("i");
    goIcon.className = "fa-solid fa-arrow-right";
    go.appendChild(goIcon);
    card.appendChild(go);

    return card;
  }

  function renderWorks() {
    if (!grid) return;
    const q = input ? input.value : "";
    const tokens = tokensOf(q);
    const searching = tokens.length > 0;

    if (searching) {
      const list = works.filter((w) => matchAll(w, tokens));
      grid.innerHTML = "";
      grid.style.display = "none";
      if (results) {
        results.innerHTML = "";
        list.forEach((w, i) => results.appendChild(makeSearchCard(w, i, tokens)));
        results.hidden = list.length === 0;
      }
      if (emptyBox) emptyBox.hidden = list.length !== 0;
      if (metaLine) {
        metaLine.textContent = list.length
          ? `找到 ${list.length} 件匹配 · 全部共 ${total} 件作品`
          : `0 件匹配「${q.trim()}」 · 全部共 ${total} 件作品`;
      }
    } else {
      if (results) {
        results.innerHTML = "";
        results.hidden = true;
      }
      if (emptyBox) emptyBox.hidden = true;
      grid.style.display = "";
      grid.innerHTML = "";
      works.slice(0, RECENT).forEach((w, i) => grid.appendChild(makeBentoCard(w, i)));
      if (metaLine) {
        metaLine.textContent = `最近更新 ${Math.min(RECENT, total)} 件 · 全部共 ${total} 件作品，搜一下更快`;
      }
    }

    if (searchBox) searchBox.classList.toggle("has-q", searching);
  }

  if (input) {
    input.addEventListener("input", renderWorks);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        input.value = "";
        renderWorks();
      }
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (input) input.value = "";
      renderWorks();
      if (input) input.focus();
    });
  }
  const emptyReset = $("#emptyReset");
  if (emptyReset) {
    emptyReset.addEventListener("click", () => {
      if (input) input.value = "";
      renderWorks();
      if (input) input.focus();
    });
  }
  renderWorks();

  /* ============================================================
     错位滚动带：全部作品的流动展示（可拖拽 / 悬停暂停 / 点击跳转）
     ============================================================ */
  const marquee = $("#cardsMarquee");

  function makeMarqueeCard(w) {
    const card = document.createElement("article");
    card.className = "work-card" + (w.link ? "" : " no-link");
    card.dataset.link = w.link || "";

    const head = document.createElement("div");
    head.className = "wc-head";
    const h3 = document.createElement("h3");
    h3.textContent = w.title;
    const cat = document.createElement("span");
    cat.className =
      "work-cat " + (w.category === CAT_VIDEO ? "cat-video" : "cat-article");
    cat.innerHTML =
      '<i class="fa-solid ' + CAT_ICON[w.category] + '"></i>' + w.category;
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
    go.textContent = w.link ? (w.category === CAT_VIDEO ? "观看视频" : "阅读原文") : "链接待填";
    if (w.link) {
      const goIcon = document.createElement("i");
      goIcon.className = "fa-solid fa-arrow-right";
      go.appendChild(goIcon);
    }
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
      works.forEach((w, i) => rowItems[i % rows.length].push(w));

      const rowStates = [];
      rows.forEach((row, r) => {
        const track = $(".marquee-track", row);
        const items = rowItems[r];
        if (!items.length) {
          row.style.display = "none";
          rowStates.push(null);
          return;
        }
        items.forEach((w) => track.appendChild(makeMarqueeCard(w)));
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

      // 拖拽 / 悬停暂停 / 点击跳转
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
        st.row.addEventListener("pointerleave", () => { st.hover = false; });

        // 点击卡片 → 打开对应链接
        track.addEventListener("click", (e) => {
          // setPointerCapture 会把 click 的 target 改写成 track，
          // 用坐标反查真实卡片
          const hit = document.elementFromPoint(e.clientX, e.clientY);
          const card = hit && hit.closest(".work-card");
          if (!card || st.moved > 6) return;
          const link = card.dataset.link;
          if (link) window.open(link, "_blank", "noopener");
        });
      });

      // 单一 rAF 驱动两行
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

  /* ============================================================
     公众号卡片：二维码收起 / 展开（圆角毛玻璃装裱）
     ============================================================ */
  const wechatCard = $("#wechatCard");
  const qrToggle = $("#qrToggle");
  if (wechatCard && qrToggle) {
    qrToggle.addEventListener("click", () => {
      const open = wechatCard.classList.toggle("open");
      qrToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
})();
