window.VARIANT = { name: "hig", hdrK: 1, expandMs: 320, collapseTbc: true, carousel: false, sheet: false };
/* Variant D · HIG rulebook + creative motion. Behaviour layer; layout/typography rules are in variant.css. */
(function () {
  var de = document.documentElement; de.classList.add("v-hig");
  var rmq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var rm = function () { return !!(rmq && rmq.matches); };
  function syncRM() { de.classList.toggle("v-rm", rm()); } syncRM(); if (rmq && rmq.addEventListener) rmq.addEventListener("change", syncRM);
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };

  /* ── 1 · staggered entrance, first load only ── */
  var entered = false;
  function enterOnce() {
    if (entered) return;
    var next = $(".st-wrap .next"), cards = $$(".st-wrap > div > .card, .st-wrap > .card");
    if (!next || !cards.length) return;
    entered = true;
    if (rm()) return;
    var vh = window.innerHeight, els = [next].concat(cards).filter(function (e) { return e.getBoundingClientRect().top < vh; }).slice(0, 6);
    els.forEach(function (e, i) { e.style.setProperty("--i", i); e.setAttribute("data-v-enter", ""); });
    setTimeout(function () { els.forEach(function (e) { e.removeAttribute("data-v-enter"); }); }, 700);
  }

  /* ── 2 · shared-element expand: thumbnail → first landscape photo ── */
  var openSet = new WeakMap(), ghost = null, ghostRaf = 0;
  function killGhost() { cancelAnimationFrame(ghostRaf); if (ghost) { ghost.remove(); ghost = null; } }
  ["touchstart", "wheel", "keydown", "pointerdown"].forEach(function (t) { window.addEventListener(t, killGhost, { passive: true, capture: true }); });
  function expand(card) {
    killGhost(); if (rm()) return;
    var timg = $(".card-head .photo img", card), tbox = $(".card-head .photo", card), tgt = $(".gallery .photo-wide", card);
    if (!timg || !tbox || !tgt) return;
    var g = document.createElement("img"); g.className = "v-ghost"; g.src = timg.currentSrc || timg.src; g.alt = ""; g.setAttribute("aria-hidden", "true"); document.body.appendChild(g); ghost = g;
    var t0 = performance.now(), D = 260;
    (function frame(now) {
      if (ghost !== g) return;
      var t = Math.min(1, (now - t0) / D), e = ease(t), a = tbox.getBoundingClientRect(), b = tgt.getBoundingClientRect();
      if (!card.classList.contains("is-open")) return killGhost();
      g.style.left = (a.left + (b.left - a.left) * e) + "px"; g.style.top = (a.top + (b.top - a.top) * e) + "px";
      g.style.width = (a.width + (b.width - a.width) * e) + "px"; g.style.height = (a.height + (b.height - a.height) * e) + "px";
      g.style.borderRadius = "12px";
      if (t < 1) ghostRaf = requestAnimationFrame(frame);
      else { g.style.transition = "opacity .08s linear"; g.style.opacity = "0"; setTimeout(function () { if (ghost === g) killGhost(); }, 90); }
    })(t0);
  }
  function watchCards() {
    $$(".st-wrap .card").forEach(function (c) {
      var was = openSet.get(c) || false, is = c.classList.contains("is-open");
      if (was !== is) { openSet.set(c, is); if (is && entered) expand(c); if (!is) killGhost(); }
    });
  }

  /* ── 3 · countdown digits roll ── */
  function rollSync(val) {
    var cd = val.parentNode, text = val.textContent || "";
    if (!/\d/.test(text) || val.classList.contains("cd-tbc")) { if (val.classList.contains("v-rolling")) val.classList.remove("v-rolling"); var o = $(".v-roll", cd); if (o) o.remove(); return; }
    var ov = $(".v-roll", cd);
    if (!ov) { ov = document.createElement("span"); ov.className = "v-roll"; ov.setAttribute("aria-hidden", "true"); cd.appendChild(ov); }
    ov.style.left = val.offsetLeft + "px"; ov.style.paddingLeft = getComputedStyle(val).paddingLeft; ov.style.fontSize = getComputedStyle(val).fontSize;
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
        var d = 220, opt = { duration: d, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" };
        now.animate([{ transform: "translateY(60%)", opacity: 0 }, { transform: "none", opacity: 1 }], opt);
        var an = prev.animate([{ transform: "none", opacity: 1 }, { transform: "translateY(-60%)", opacity: 0 }], opt);
        an.onfinish = an.oncancel = function () { prev.remove(); };
      });
    }
    ov.__txt = text;
  }
  function liveSync() {
    var next = $(".st-wrap .next"); if (!next) return;
    var cd = $(".cd", next), val = cd && $(".cd-val", cd);
    if (val) rollSync(val);
    var live = !!cd && (cd.classList.contains("cd-inflight") || /^\d{1,2}:\d{2}:\d{2}$/.test((val && val.textContent || "").trim()) && !!$(".cd-tag", cd));
    if (live) next.setAttribute("data-v-live", ""); else next.removeAttribute("data-v-live");
  }

  /* ── 4 · Road dots fill on completion ── */
  var dotObs;
  function observeDots(root) {
    dotObs = new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        var d = m.target, was = /dot-(done|complete)/.test(m.oldValue || ""), is = /dot-(done|complete)/.test(d.className);
        if (!was && is && entered && !rm()) { d.classList.remove("v-filled"); void d.offsetWidth; d.classList.add("v-filled"); setTimeout(function () { d.classList.remove("v-filled"); }, 450); }
      });
    });
    dotObs.observe(root, { subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
  }
  /* class changes on non-dot nodes are filtered in the callback above by matching only .dot targets */

  /* ── sheet: About ── */
  var lastOpener = null;
  function sheetSync() {
    var a = $(".about"); if (!a) return;
    if (!$(".v-sheet-bar", a)) {
      var bar = document.createElement("div"); bar.className = "v-sheet-bar";
      bar.innerHTML = '<button type="button" class="v-close">Close</button><span></span>'; a.insertBefore(bar, a.firstChild);
      $(".v-close", bar).addEventListener("click", function () { var s = $(".scrim.show"); if (s) s.click(); });
      drag(a, bar);
    }
    var open = a.classList.contains("show");
    if (open && !a.__wasOpen) { lastOpener = document.activeElement; setTimeout(function () { var c = $(".v-close", a); if (c) c.focus({ preventScroll: true }); }, 60); a.setAttribute("role", "dialog"); a.setAttribute("aria-modal", "true"); }
    if (!open && a.__wasOpen) { var o = lastOpener && document.contains(lastOpener) ? lastOpener : $(".hdr-left"); if (o && o.focus) o.focus({ preventScroll: true }); a.style.transform = ""; a.classList.remove("v-dragging"); }
    a.__wasOpen = open;
  }
  function drag(a, bar) {
    var d = null;
    bar.addEventListener("touchstart", function (e) { if (e.touches.length === 1) d = { y: e.touches[0].clientY, t: performance.now(), dy: 0 }; }, { passive: true });
    bar.addEventListener("touchmove", function (e) {
      if (!d) return; d.dy = Math.max(0, e.touches[0].clientY - d.y); if (e.cancelable) e.preventDefault();
      a.classList.add("v-dragging"); a.style.transform = "translate3d(0," + d.dy + "px,0)";
      var s = $(".scrim.show"); if (s) s.style.opacity = String(Math.max(0, 1 - d.dy / 500));
    }, { passive: false });
    function end() {
      if (!d) return; var dy = d.dy, v = dy / Math.max(1, performance.now() - d.t); d = null;
      var s = $(".scrim"); if (s) s.style.opacity = "";
      a.classList.remove("v-dragging");
      if (dy > 100 || (v > .5 && dy > 30)) { var sc = $(".scrim.show"); a.style.transition = "transform .22s cubic-bezier(.4,0,1,1)"; a.style.transform = "translate3d(0,102%,0)"; setTimeout(function () { a.style.transition = ""; if (sc) sc.click(); setTimeout(function () { a.style.transform = ""; }, 60); }, 200); }
      else { a.style.transition = "transform .3s cubic-bezier(.25,.8,.25,1)"; a.style.transform = ""; setTimeout(function () { a.style.transition = ""; }, 320); }
    }
    bar.addEventListener("touchend", end); bar.addEventListener("touchcancel", end);
  }

  /* keep the flight number with the word before it ("Flight 15" never splits) */
  function glue() {
    $$(".title, .next-title").forEach(function (t) {
      if (t.__glued) return; var w = $(".t-word", t), n = $(".t-num", t); if (!w || !n || !w.firstChild || w.firstChild.nodeType !== 3) return;
      var parts = w.firstChild.nodeValue.split(" "); if (parts.length < 2) return; t.__glued = 1;
      var last = parts.pop(); w.firstChild.nodeValue = parts.join(" ") + " ";
      var g = document.createElement("span"); g.className = "v-glue"; var lw = document.createElement("span"); lw.className = w.className; lw.textContent = last;
      w.after(g); g.appendChild(lw); g.appendChild(document.createTextNode(" ")); g.appendChild(n);
      var sp = w.nextSibling; /* the original space text node sits after the glue now: harmless */
    });
  }
  /* HIG Accessibility: every control needs a label. Media thumbnails in updates are links with an empty alt. */
  function nameLinks() {
    document.querySelectorAll("a[href]:not([aria-label])").forEach(function (a) {
      if ((a.textContent || "").trim() || a.title) return;
      var host = ""; try { host = new URL(a.href).hostname.replace(/^www\./, ""); } catch (e) {}
      a.setAttribute("aria-label", "Open photo or video source" + (host ? " on " + host : "") + " (new tab)");
    });
  }
  function tick() { nameLinks(); glue(); enterOnce(); watchCards(); liveSync(); sheetSync(); }
  function start() {
    var root = document.getElementById("root");
    new MutationObserver(tick).observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class"] });
    observeDots(root); tick();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
