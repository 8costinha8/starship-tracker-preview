window.VARIANT = { name: "energy", hdrK: 0.86, expandMs: 300, collapseTbc: true, carousel: true, sheet: false };
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
      var n = g.querySelectorAll(".photo-wide").length;
      var d = g.nextElementSibling && g.nextElementSibling.classList.contains("v-dots") ? g.nextElementSibling : null;
      if (n < 2) return;
      if (!d) { d = document.createElement("div"); d.className = "v-dots"; d.setAttribute("aria-hidden", "true"); g.after(d);
        g.addEventListener("scroll", function () { var i = Math.round(g.scrollLeft / (g.scrollWidth / n)); [].forEach.call(d.children, function (c, k) { c.classList.toggle("on", k === i); }); }, { passive: true }); }
      if (d.children.length !== n) { d.innerHTML = ""; for (var i = 0; i < n; i++) { var s = document.createElement("i"); if (!i) s.className = "on"; d.appendChild(s); } }
    });
  }
  new MutationObserver(dots).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["class"] });
})();
