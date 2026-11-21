window.VARIANT = { name: "calm", hdrK: 1, expandMs: 240, collapseTbc: true, carousel: false, sheet: false };
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
