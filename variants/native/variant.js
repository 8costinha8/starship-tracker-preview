window.VARIANT = { name: "native", hdrK: 1, expandMs: 0, collapseTbc: true, carousel: false, sheet: true };
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
    es.forEach(function (e) { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
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
/* ── Apple-native behaviours: large titles, collapsing bar, card sheets with drag-to-dismiss ── */
(function () {
  var de = document.documentElement; de.classList.add("v-sheet");
  var rm = function () { return de.classList.contains("v-rm"); };
  /* large titles */
  function ensureTitles() {
    var top = document.querySelector(".st-wrap > .top");
    if (top && !(top.nextElementSibling && top.nextElementSibling.classList.contains("v-large"))) {
      var t = document.createElement("div"); t.className = "v-large"; t.setAttribute("aria-hidden", "true");
      t.innerHTML = "<span>Starship</span><b>Flight Log</b>"; top.after(t);
    }
    var fh = document.querySelector(".feed-pane .feed-head"), hb = document.querySelector(".hdr-b span");
    if (fh && hb) {
      var n = fh.nextElementSibling && fh.nextElementSibling.classList.contains("v-large") ? fh.nextElementSibling : null;
      if (!n) { n = document.createElement("div"); n.className = "v-large"; n.setAttribute("aria-hidden", "true"); fh.after(n); }
      var txt = "<span>Starship</span><b>Road to " + hb.textContent + "</b>";
      if (n.innerHTML !== txt) n.innerHTML = txt;
    }
  }
  /* collapse: --lt 0..1 over the first 52px of scroll on whichever page owns the scroll */
  function onScroll() {
    var open = !!document.querySelector(".st.feed-open"), feed = document.querySelector(".feed-pane .feed");
    var y = open && feed ? feed.scrollTop : window.scrollY, lt = Math.max(0, Math.min(1, y / 52));
    document.querySelectorAll(".v-large").forEach(function (el) { el.style.setProperty("--lt", lt.toFixed(3)); });
    de.classList.toggle("v-collapsed", y > 44);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("scroll", function (e) { if (e.target && e.target.classList && e.target.classList.contains("feed")) onScroll(); }, { passive: true, capture: true });
  /* sheets */
  var scrim = null, passClick = false;
  function openCard() { return document.querySelector(".st-wrap .card.is-open"); }
  function reactToggle(card) { passClick = true; try { card.querySelector(".card-head").click(); } finally { passClick = false; } }
  function closeSheet(card, fromDy) {
    card = card || openCard(); if (!card) return;
    var more = card.querySelector(".more");
    if (rm() || !more) { reactToggle(card); return sync(); }
    more.style.setProperty("--v-dy", (fromDy || 0) + "px"); more.style.transform = ""; more.removeAttribute("data-v-drag");
    more.setAttribute("data-v-closing", ""); if (scrim) scrim.classList.remove("on");
    setTimeout(function () { more.removeAttribute("data-v-closing"); more.style.removeProperty("--v-dy"); reactToggle(card); sync(); }, 250);
  }
  function sync() {
    ensureTitles();
    var card = openCard();
    var host = document.querySelector(".st"); // inside the app's isolated stacking context, so the sheet (z 41) sits above it
    if (!scrim) { scrim = document.createElement("div"); scrim.className = "v-sheet-scrim"; scrim.addEventListener("click", function () { closeSheet(); }); }
    if (host && scrim.parentNode !== host) host.appendChild(scrim);
    scrim.classList.toggle("on", !!card); de.classList.toggle("v-sheet-open", !!card);
    if (card) {
      var more = card.querySelector(".more");
      if (more && !more.querySelector(":scope > .v-grab")) {
        var g = document.createElement("div"); g.className = "v-grab"; g.setAttribute("aria-hidden", "true"); more.prepend(g);
        var x = document.createElement("button"); x.className = "v-sheet-x"; x.type = "button"; x.setAttribute("aria-label", "Close"); x.textContent = "✕";
        x.addEventListener("click", function (e) { e.stopPropagation(); closeSheet(card); }); more.prepend(x);
        var tt = card.querySelector(".card-head .t-num"), dt = card.querySelector(".card-head .date"), pill = card.querySelector(".card-head .pill");
        var eb = document.createElement("div"); eb.className = "v-sheet-eyebrow"; eb.textContent = ["Flight " + (tt ? tt.textContent : ""), dt && dt.textContent, pill && pill.textContent].filter(Boolean).join(" · ");
        var pad = more.querySelector(".more-pad"); if (pad) pad.prepend(eb);
        more.scrollTop = 0; attachDrag(more, card);
      }
      more && more.setAttribute("role", "dialog");
    }
  }
  function attachDrag(more, card) {
    var d = null;
    more.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      d = { y: e.touches[0].clientY, x: e.touches[0].clientX, t: performance.now(), dy: 0, on: false, top: more.scrollTop <= 0 };
    }, { passive: true });
    more.addEventListener("touchmove", function (e) {
      if (!d) return; var t = e.touches[0], dy = t.clientY - d.y, dx = t.clientX - d.x;
      if (!d.on) { if (!d.top || dy < 8 || Math.abs(dx) > dy) { if (Math.abs(dy) > 8 || Math.abs(dx) > 8) d = d.on ? d : null; return; } d.on = true; more.setAttribute("data-v-drag", ""); }
      if (e.cancelable) e.preventDefault();
      d.dy = Math.max(0, dy); d.v = d.dy / Math.max(1, performance.now() - d.t);
      more.style.transform = "translate3d(0," + d.dy + "px,0)";
      if (scrim) scrim.style.opacity = String(Math.max(0, 1 - d.dy / 500));
    }, { passive: false });
    function end() {
      if (!d || !d.on) { d = null; return; }
      var dy = d.dy, fast = d.v > 0.6; d = null; if (scrim) scrim.style.opacity = "";
      if (dy > 110 || (fast && dy > 30)) closeSheet(card, dy);
      else { more.removeAttribute("data-v-drag"); more.style.transition = "transform .35s cubic-bezier(.32,.72,0,1)"; more.style.transform = ""; setTimeout(function () { more.style.transition = ""; }, 360); }
    }
    more.addEventListener("touchend", end); more.addEventListener("touchcancel", end);
  }
  /* tapping the open card's own row closes with the sheet animation */
  document.addEventListener("click", function (e) {
    if (passClick) return;
    var h = e.target.closest && e.target.closest(".card.is-open > .card-head");
    if (h) { e.stopPropagation(); e.preventDefault(); closeSheet(h.parentElement); }
  }, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && openCard()) closeSheet(); });
  function start() {
    sync(); onScroll();
    new MutationObserver(function () { sync(); }).observe(document.getElementById("root"), { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
