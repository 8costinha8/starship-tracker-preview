window.VARIANT = { name: "energy", hdrK: 0.9, expandMs: 300, collapseTbc: true, carousel: true, sheet: false };
/* ── Variant core (shared by all three variants): page-level classes, entrance reveal, reduced motion ── */
(function () {
  var V = window.VARIANT || {};
  var de = document.documentElement;
  var rm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  function syncRM() { de.classList.toggle("v-rm", !!(rm && rm.matches)); }
  syncRM(); if (rm && rm.addEventListener) rm.addEventListener("change", syncRM);
  de.classList.add("v-" + V.name);
  // Entrance reveal: data attribute (React never rewrites it), so re-renders can't hide a card again.
  var SEL = V.revealSel || ".st-wrap > div > .card, .feed-list .post, .feed-section.rfs";
  function reveal(el) { el.setAttribute("data-v-in", ""); }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    var k = 0; /* v2: elements that arrive in the same batch fan in 55 ms apart (max 5 steps); the delay is cleared afterwards so taps stay instant */
    es.forEach(function (e) { if (e.isIntersecting) { var t = e.target; t.style.setProperty("--d", Math.min(k++, 5) * 55 + "ms"); reveal(t); io.unobserve(t); setTimeout(function () { t.style.removeProperty("--d"); }, 800); } });
  }, { rootMargin: "0px 0px -6% 0px" }) : null;
  function scan() {
    document.querySelectorAll(SEL).forEach(function (el) {
      if (el.__vSeen) return; el.__vSeen = 1;
      if (!io || de.classList.contains("v-rm")) return reveal(el);
      el.setAttribute("data-v-pending", ""); io.observe(el);
    });
  }
  function start() {
    de.classList.add("v-ready");
    scan(); new MutationObserver(scan).observe(document.getElementById("root"), { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.__vReveal = scan;
})();
/* Haptic-like taps: a 6–10ms tick where the platform allows it (Android; iOS Safari ignores vibrate, the press-in scale carries it). */
(function () {
  var TAP = ".card-head, .road-head, .past-toggle, .hdr-p, .round-btn, .highlights-link, .gallery > .photo-wide, button.feed-pill";
  document.addEventListener("pointerdown", function (e) {
    if (!e.target.closest || !e.target.closest(TAP)) return;
    if (document.documentElement.classList.contains("v-rm")) return;
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (x) {}
  }, { passive: true });
  /* swipe dots under each photo carousel */
  function dots() {
    document.querySelectorAll(".card.is-open .gallery").forEach(function (g) {
      var slides = g.querySelectorAll(".photo-wide"), n = slides.length;
      var d = g.nextElementSibling && g.nextElementSibling.classList.contains("v-dots") ? g.nextElementSibling : null;
      if (n < 2) { if (d) d.remove(); return; }
      if (!d) {
        d = document.createElement("div"); d.className = "v-dots"; d.setAttribute("aria-hidden", "true"); g.after(d);
        g.addEventListener("scroll", function () { syncDots(g, d); }, { passive: true });
      }
      syncDots(g, d);
    });
  }
  function syncDots(g, d) {
    var slides = g.querySelectorAll(".photo-wide"), n = slides.length; if (!n) return;
    var gap = parseFloat(getComputedStyle(g).columnGap || getComputedStyle(g).gap) || 10;
    var w = slides[0].offsetWidth + gap;
    var i = Math.max(0, Math.min(n - 1, Math.round(g.scrollLeft / w)));
    if (n > 8) {
      d.setAttribute("data-many", "");
      d.innerHTML = '<span class="v-count">' + (i + 1) + " / " + n + "</span>";
    } else {
      d.removeAttribute("data-many");
      if (d.querySelector(".v-count") || d.children.length !== n) {
        d.innerHTML = "";
        for (var k = 0; k < n; k++) { var s = document.createElement("i"); if (k === i) s.className = "on"; d.appendChild(s); }
      } else {
        [].forEach.call(d.children, function (c, k) { c.classList.toggle("on", k === i); });
      }
    }
  }
  /* v5: dots are rendered by the React PhotoCarousel (live while dragging); this old scroll-based indicator is off */
})();

/* ═════════ v2 additions: countdown tick, Road progress, launch-day state, less clutter, menu close ═════════ */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
  function rm() { return rmq.matches || document.documentElement.classList.contains("v-rm"); }

  /* countdown tick: an overlay of per-character cells; only changed characters roll. The real text stays in place for layout and screen readers. */
  function rollSync(val) {
    var cd = val.parentNode, text = val.textContent || "";
    if (!/\d/.test(text) || val.classList.contains("cd-tbc")) { if (val.classList.contains("v-rolling")) val.classList.remove("v-rolling"); var o = $(".v-roll", cd); if (o) o.remove(); return; }
    var ov = $(".v-roll", cd);
    if (!ov) { ov = document.createElement("span"); ov.className = "v-roll"; ov.setAttribute("aria-hidden", "true"); cd.appendChild(ov); }
    var cs = getComputedStyle(val);
    ov.style.left = val.offsetLeft + "px"; ov.style.paddingLeft = cs.paddingLeft; ov.style.fontSize = cs.fontSize; ov.style.fontFamily = cs.fontFamily; ov.style.fontWeight = cs.fontWeight; ov.style.letterSpacing = cs.letterSpacing;
    var chars = [].slice.call(text), cur = ov.__txt || null;
    if (!val.classList.contains("v-rolling")) val.classList.add("v-rolling");
    if (cur === text) return;
    if (!cur || cur.length !== chars.length) {
      ov.innerHTML = ""; chars.forEach(function (c) { var s = document.createElement("span"); s.className = "v-ch"; s.innerHTML = "<i></i>"; s.firstChild.textContent = c; ov.appendChild(s); });
    } else {
      chars.forEach(function (c, i) {
        if (c === cur[i]) return;
        var span = ov.children[i], now = span.firstChild; now.textContent = c;
        if (rm() || !now.animate) return;
        var prev = document.createElement("i"); prev.className = "v-prev"; prev.textContent = cur[i]; span.appendChild(prev);
        var opt = { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" };
        now.animate([{ transform: "translateY(60%)", opacity: 0 }, { transform: "none", opacity: 1 }], opt);
        var an = prev.animate([{ transform: "none", opacity: 1 }, { transform: "translateY(-60%)", opacity: 0 }], opt);
        an.onfinish = an.oncancel = function () { prev.remove(); };
      });
    }
    ov.__txt = text;
  }
  /* launch-day state: within a day of launch, or in flight → data-v-live on the hero (drives the pulses) */
  function liveSync() {
    var next = $(".st-wrap .next"); if (!next) return;
    var cd = $(".cd", next), val = cd && $(".cd-val", cd);
    if (val) rollSync(val);
    var live = !!cd && (cd.classList.contains("cd-inflight") || (/^\d{1,2}:\d{2}:\d{2}$/.test((val && val.textContent || "").trim()) && !!$(".cd-tag", cd)));
    if (live && !next.hasAttribute("data-v-live")) next.setAttribute("data-v-live", "");
    if (!live && next.hasAttribute("data-v-live")) next.removeAttribute("data-v-live");
  }
  /* Road dots fill when a milestone completes */
  var booted = false;
  new MutationObserver(function (ms) {
    if (!booted) return;
    ms.forEach(function (m) {
      var d = m.target; if (!d.classList || !d.classList.contains("dot")) return;
      var was = /dot-(done|complete)/.test(m.oldValue || ""), is = /dot-(done|complete)/.test(d.className);
      if (!was && is && !rm()) { d.classList.remove("v-filled"); void d.offsetWidth; d.classList.add("v-filled"); setTimeout(function () { d.classList.remove("v-filled"); }, 450); }
    });
  }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
  setTimeout(function () { booted = true; }, 2500);

  /* Page 2 progress line under each flight bar: fills each time the page slides into view */
  var pio = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle("v-on", e.isIntersecting); });
  }, { threshold: 0.6 }) : null;
  function progress() {
    $$(".feed-pill").forEach(function (b) {
      var rc = $(".road-count", b); var t = ((rc && rc.textContent) || "").match(/(\d+)\s+of\s+(\d+)/); if (!t) return;
      var bar = $(".v-prog", b);
      if (!bar) { bar = document.createElement("i"); bar.className = "v-prog"; bar.setAttribute("aria-hidden", "true"); b.appendChild(bar); if (pio) pio.observe(bar); else bar.classList.add("v-on"); }
      var p = +t[2] ? +t[1] / +t[2] : 0; bar.style.setProperty("--p", p.toFixed(3));
    });
  }
  /* less on screen */
  function trim() {
    $$(".next .facts dt").forEach(function (dt) { if (/^window$/i.test(dt.textContent.trim())) { var dd = dt.nextElementSibling; if (dd && /only/i.test(dd.textContent) && !dt.classList.contains("v-fold")) { dt.classList.add("v-fold"); dd.classList.add("v-fold"); } } });
    $$(".about dt").forEach(function (dt) { if (/^next flight$/i.test(dt.textContent.trim()) && !dt.classList.contains("v-fold")) { dt.classList.add("v-fold"); if (dt.nextElementSibling) dt.nextElementSibling.classList.add("v-fold"); } });
  }
  /* menu: a real Close button */
  function menuClose() {
    var a = $(".about"); if (!a || $(".v-close", a)) return;
    var b = document.createElement("button"); b.type = "button"; b.className = "v-close"; b.setAttribute("aria-label", "Close menu"); b.textContent = "✕";
    b.addEventListener("click", function () { var s = $(".scrim.show"); if (s) s.click(); }); a.appendChild(b);
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { var s = $(".scrim.show"); if (s) s.click(); } });
  /* name image-only links (the little thumbnails inside updates) */
  function nameLinks() {
    $$("a[href]:not([aria-label])").forEach(function (a) {
      if ((a.textContent || "").trim() || a.title) return;
      var host = ""; try { host = new URL(a.href).hostname.replace(/^www\./, ""); } catch (x) {}
      a.setAttribute("aria-label", "Open photo or video source" + (host ? " on " + host : "") + " (new tab)");
    });
  }
  var raf = 0;
  function tick() { raf = 0; liveSync(); progress(); trim(); menuClose(); nameLinks(); }
  function sched() { if (!raf) raf = requestAnimationFrame(tick); }
  function start() { new MutationObserver(sched).observe(document.getElementById("root"), { childList: true, subtree: true, characterData: true }); tick(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

/* v9 · Road dots pop on close as a clean uniform-scale mirror of mo-pop.
   The v7/v8 close used a fixed flex-row clone of .road-dots on document.body.
   Reparenting those <i class="dot"> flex items out of .road-head { all: unset }
   let the body's font line-height strut set min-height:auto (~12px) while width
   stayed 10px, so every close frame was a vertical oval (measured 10×12 at rest).
   Animate one independently positioned square per dot instead: equal width/height,
   min/max locked, line-height 0, scale() only, transform-origin 50% 50%. */
(function () {
  var prev = new WeakMap();
  var playing = new WeakSet();
  function reduced() {
    try { return matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("v-rm"); }
    catch (e) { return false; }
  }
  function playClose(el) {
    if (!el || reduced() || playing.has(el)) return;
    var wrap = el.querySelector(".road-dots");
    if (!wrap || !wrap.children.length) return;
    var orig = wrap.querySelectorAll(".dot");
    if (!orig.length) return;
    playing.add(el);
    var host = document.createElement("div");
    host.setAttribute("data-v-dots-clone", "");
    host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;";
    var clones = [];
    var last = null;
    for (var i = 0; i < orig.length; i++) {
      var r = orig[i].getBoundingClientRect();
      var size = Math.min(r.width, r.height);
      if (!size) size = 10;
      var cs = getComputedStyle(orig[i]);
      var d = document.createElement("i");
      d.className = "dot";
      d.setAttribute("aria-hidden", "true");
      d.style.cssText = [
        "position:fixed",
        "left:" + (r.left + r.width / 2 - size / 2) + "px",
        "top:" + (r.top + r.height / 2 - size / 2) + "px",
        "width:" + size + "px",
        "height:" + size + "px",
        "min-width:" + size + "px",
        "min-height:" + size + "px",
        "max-width:" + size + "px",
        "max-height:" + size + "px",
        "margin:0",
        "padding:0",
        "box-sizing:border-box",
        "display:block",
        "border-radius:50%",
        "line-height:0",
        "font-size:0",
        "flex:none",
        "aspect-ratio:1/1",
        "transform-origin:50% 50%",
        "background:" + cs.background,
        "border:" + cs.border,
        "box-shadow:" + cs.boxShadow,
        "opacity:" + cs.opacity,
        "pointer-events:none"
      ].join(";");
      var cvar = cs.getPropertyValue("--c");
      if (cvar) d.style.setProperty("--c", cvar);
      host.appendChild(d);
      clones.push({ el: d, orig: orig[i], size: size });
      var delay = (orig.length - 1 - i) * 30;
      if (d.animate) {
        last = d.animate(
          [{ transform: "scale(1)" }, { transform: "scale(.4)", offset: 0.4 }, { transform: "scale(1)" }],
          { duration: 420, delay: delay, easing: "cubic-bezier(.34, 1.36, .64, 1)" }
        );
      }
    }
    document.documentElement.appendChild(host);
    el.setAttribute("data-v-hiding-dots", "");
    var moved = true;
    var tick = function () {
      if (!moved || !host.parentNode) return;
      for (var i = 0; i < clones.length; i++) {
        var o = clones[i].orig;
        if (!o || !o.isConnected) continue;
        var r = o.getBoundingClientRect();
        var size = clones[i].size;
        clones[i].el.style.left = (r.left + r.width / 2 - size / 2) + "px";
        clones[i].el.style.top = (r.top + r.height / 2 - size / 2) + "px";
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    var done = function () {
      moved = false;
      if (host.parentNode) host.parentNode.removeChild(host);
      el.removeAttribute("data-v-hiding-dots");
      playing.delete(el);
    };
    var t0 = Date.now();
    var finish = function () {
      if (Date.now() - t0 < 520) return;
      done();
    };
    if (last && last.finished) last.finished.then(finish);
    setTimeout(done, 700);
  }
  function check(el) {
    if (!el || !el.matches || !el.matches(".road-head, .past-toggle")) return;
    var open = el.getAttribute("aria-expanded") === "true" || el.classList.contains("open");
    var was = prev.get(el);
    prev.set(el, open);
    if (was !== true || open) return;
    playClose(el);
  }
  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest && e.target.closest(".road-head, .past-toggle");
    if (!el) return;
    var open = el.getAttribute("aria-expanded") === "true" || el.classList.contains("open");
    if (open) playClose(el);
  }, true);
  new MutationObserver(function (muts) {
    muts.forEach(function (m) { check(m.target); });
  }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["aria-expanded", "class"] });
})();
