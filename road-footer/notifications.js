/* PREVIEW STUB (starship-tracker-preview/road-footer only): no Firebase, no push token, nothing leaves the browser.
   Lets the notification prompt and Manage notifications render so the button styles can be reviewed.
   "Enable" only flips a local flag in this browser; it does NOT subscribe to anything. */
(function () {
  const K = "pv_notif_status";
  const get = () => { try { return localStorage.getItem(K); } catch (e) { return null; } };
  const set = (v) => { try { localStorage.setItem(K, v); } catch (e) {} };
  window.STNotify = {
    subscribe: async () => { set("on"); return { ok: true, preview: true }; },
    unsubscribe: async () => { set("off"); return { ok: true }; },
    dismiss: () => set("off"),
    getStatus: () => (get() === "on" ? "on" : "off"),
    hasDecided: () => get() != null,
    sendFeedback: async () => ({ ok: false, error: "Preview: feedback is not sent" }),
  };
})();
