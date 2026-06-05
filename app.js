/* ============================================================
   AP LANG ULTIMATE GUIDE — interaction engine
   ============================================================ */
(function () {
  "use strict";
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Progress bar + nav scrolled state ---------- */
  const progress = $("#progress");
  const nav = $("#nav");
  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    progress.style.width = pct + "%";
    nav.classList.toggle("scrolled", h.scrollTop > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Smooth scroll for nav + brand ---------- */
  $$("[data-nav]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id && id.startsWith("#")) {
        const t = $(id);
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
      }
    });
  });
  const brand = $(".brand[data-scrollto]");
  if (brand) brand.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));

  /* ---------- Active nav link via section observation ---------- */
  const navLinks = $$(".nav-links a");
  const linkFor = {};
  navLinks.forEach((l) => { linkFor[l.getAttribute("href").slice(1)] = l; });
  const sections = Object.keys(linkFor).map((id) => $("#" + id)).filter(Boolean);
  const navObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        navLinks.forEach((l) => l.classList.remove("active"));
        const l = linkFor[en.target.id];
        if (l) l.classList.add("active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
  sections.forEach((s) => navObs.observe(s));

  /* ---------- Generic reveal engine ---------- */
  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  $$("[data-reveal]").forEach((el) => revealObs.observe(el));

  /* ---------- Timeline + meters (add .in when seen) ---------- */
  const inObs = new IntersectionObserver((entries, obs) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); }
    });
  }, { threshold: 0.3 });
  const tl = $("[data-timeline]"); if (tl) inObs.observe(tl);
  $$("[data-meter]").forEach((m) => inObs.observe(m));

  /* ---------- Rubric flip cards ---------- */
  $$("[data-flip]").forEach((f) => {
    f.setAttribute("tabindex", "0");
    f.setAttribute("role", "button");
    const toggle = () => f.classList.toggle("flipped");
    f.addEventListener("click", toggle);
    f.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });

  /* ---------- Annotated essays: light segment + sync notes ---------- */
  $$("[data-essay]").forEach((essay) => {
    const segs = $$(".essay-seg", essay);
    const notes = $$(".note", essay);
    const segObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const seg = en.target;
        const key = seg.dataset.seg;
        segs.forEach((s) => s.classList.toggle("lit", s === seg));
        notes.forEach((n) => n.classList.toggle("active", n.dataset.note === key));
      });
    }, { rootMargin: "-42% 0px -42% 0px", threshold: 0 });
    segs.forEach((s) => segObs.observe(s));
  });

  /* ---------- Flying source chips ---------- */
  const flyObs = new IntersectionObserver((entries, obs) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        setTimeout(() => en.target.classList.add("flew"), 220);
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.4 });
  $$(".fly-para[data-fly]").forEach((p) => flyObs.observe(p));

  /* ---------- Synthesis: source sorting with FLIP ---------- */
  (function () {
    const btn = $("[data-sort-btn]");
    const pool = $("[data-sort-pool]");
    if (!btn || !pool) return;
    const cards = $$(".src-card", pool);
    const slots = {};
    $$(".group-col[data-group]").forEach((g) => { slots[g.dataset.group] = $(".gc-slot", g); });
    let sorted = false;

    function flip(moves) {
      if (reduce) { moves.forEach((m) => m.run()); return; }
      const first = moves.map((m) => m.el.getBoundingClientRect());
      moves.forEach((m) => m.run());
      moves.forEach((m, i) => {
        const last = m.el.getBoundingClientRect();
        const dx = first[i].left - last.left;
        const dy = first[i].top - last.top;
        m.el.style.transition = "none";
        m.el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        moves.forEach((m, i) => {
          m.el.style.transition = "transform .6s cubic-bezier(.22,1,.36,1)";
          m.el.style.transitionDelay = (i * 55) + "ms";
          m.el.style.transform = "";
        });
      }));
    }

    btn.addEventListener("click", () => {
      if (!sorted) {
        // briefly highlight groups
        $$(".group-col").forEach((g) => g.classList.add("hot"));
        setTimeout(() => $$(".group-col").forEach((g) => g.classList.remove("hot")), 900);
        flip(cards.map((c) => ({ el: c, run: () => slots[c.dataset.group].appendChild(c) })));
        btn.innerHTML = 'Reset <span class="arr">↺</span>';
        sorted = true;
      } else {
        flip(cards.map((c) => ({ el: c, run: () => pool.appendChild(c) })));
        btn.innerHTML = 'Group the sources <span class="arr">→</span>';
        sorted = false;
      }
    });
  })();

  /* ---------- Mistakes tracker ---------- */
  (function () {
    const tracker = $("[data-mistakes-tracker]");
    if (!tracker) return;
    const numEl = $(".st-num", tracker);
    const bar = $(".st-meter span", tracker);
    const total = $$("[data-mistake]").length;
    let count = 0;
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          count++;
          numEl.textContent = count;
          bar.style.width = (count / total * 100) + "%";
          numEl.animate(
            [{ transform: "scale(1.4)", color: "#e8806d" }, { transform: "scale(1)" }],
            { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" }
          );
          o.unobserve(en.target);
        }
      });
    }, { threshold: 0.6 });
    $$("[data-mistake]").forEach((m) => obs.observe(m));
  })();

  /* ---------- Checklist fill ---------- */
  (function () {
    const items = $$("[data-check]");
    if (!items.length) return;
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const idx = items.indexOf(en.target);
          setTimeout(() => en.target.classList.add("done"), reduce ? 0 : Math.min(idx, 6) * 90);
          o.unobserve(en.target);
        }
      });
    }, { threshold: 0.7 });
    items.forEach((i) => obs.observe(i));
  })();

  /* ---------- Time management clock ---------- */
  (function () {
    const clock = $("[data-clock]");
    const detail = $("[data-time-detail]");
    if (!clock || !detail) return;
    const readC = $(".c-read", clock);
    const writeC = $(".c-write", clock);
    const totalEl = $("[data-clock-total]");
    const readLabelEl = $("[data-read-label]");
    const R = 120, C = 2 * Math.PI * R;
    [readC, writeC].forEach((c) => { c.style.strokeDasharray = `0 ${C}`; });

    const data = {
      synthesis: {
        total: 55, read: 15, write: 40, readLabel: "Read & plan",
        rows: [
          { min: "15 min", act: "Read all sources, mark positions, group by idea", t: "read" },
          { min: "40 min", act: "Write — one idea per body paragraph, sources woven in", t: "write" },
        ],
      },
      rhetoric: {
        total: 50, read: 10, write: 40, readLabel: "Read & annotate",
        rows: [
          { min: "10 min", act: "Read & annotate; map the rhetorical situation", t: "read" },
          { min: "40 min", act: "Write — choice → effect → purpose, every paragraph", t: "write" },
        ],
      },
      argument: {
        total: 50, read: 10, write: 40, readLabel: "Plan",
        rows: [
          { min: "10 min", act: "Plan your claim and two specific examples", t: "read" },
          { min: "40 min", act: "Write — build the case, then complicate it", t: "write" },
        ],
      },
    };

    function render(key) {
      const d = data[key];
      const readLen = C * d.read / d.total;
      const writeLen = C * d.write / d.total;
      totalEl.textContent = d.total;
      readLabelEl.textContent = d.readLabel;
      readC.style.strokeDasharray = `${readLen} ${C - readLen}`;
      readC.style.strokeDashoffset = "0";
      writeC.style.strokeDasharray = `${writeLen} ${C - writeLen}`;
      writeC.style.strokeDashoffset = `${-readLen}`;
      detail.innerHTML =
        `<h3>${key === "rhetoric" ? "Rhetorical Analysis" : key.charAt(0).toUpperCase() + key.slice(1)}</h3>` +
        `<div class="time-rows">` +
        d.rows.map((r) =>
          `<div class="time-row"><span class="tr-dot" style="background:${r.t === "read" ? "#b9cfe0" : "var(--amber)"}"></span><span class="tr-min">${r.min}</span><span class="tr-act">${r.act}</span></div>`
        ).join("") +
        `</div>`;
    }

    $$("[data-time-tab]").forEach((tab) => {
      tab.addEventListener("click", () => {
        $$("[data-time-tab]").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        render(tab.dataset.timeTab);
      });
    });

    // initial draw when the clock scrolls into view
    let drawn = false;
    const cObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting && !drawn) { drawn = true; render("synthesis"); } });
    }, { threshold: 0.4 });
    cObs.observe(clock);
    render("synthesis"); // also render immediately so detail isn't empty
  })();

})();
