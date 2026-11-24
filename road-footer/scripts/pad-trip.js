/* Pad trips (app + Node, pure data: no fetch, no DOM).
   Rule (24 Nov, Bernardo via Tusk): a vehicle's trip TO the pad, what happens AT the pad (chopstick lifts, pusher /
   load tests, mounting), and its return FROM the pad to the build site are ONE pad activity. They form one Pad card,
   whichever box the posts were filed under (a return from the pad never inherits the vehicle's latest test). Its
   headline is the work at the pad (a chopstick lift → "Ship 43 lifted on the chopsticks at Pad 2."); every other post
   of the trip sits under Earlier updates in chronological order (trip_order: "chrono"). Same-move duplicates merge
   (same vehicle, same move — to the pad / back to the site —, same phase — set off / arrived —, within MERGE_H hours):
   the earliest post stays, the others are kept in its merged list.
   A return that is NOT preceded by a pad trip (e.g. "returned to Megabay 2 after cryo testing") is not touched.
   applyToRoad(road) returns a NEW road (input untouched): trip entries are folded into one pad history entry. */
(function (root, factory) { if (typeof module === "object" && module.exports) module.exports = factory(); else root.PadTrip = factory(); })(typeof self !== "undefined" ? self : this, function () {
  const MERGE_H = 72;       // "within a few days"
  const TRIP_MAX_D = 10;    // a pad trip lasts at most this long (start → return)
  const RETURN_TAIL_H = 12; // after the first return post, later return posts within this window are the same return
  const BOXES = ["cryo", "raptor", "static", "pad"];
  const T = (x) => { const t = Date.parse((x && x.at) || ""); return Number.isFinite(t) ? t : 0; };
  const txt = (x) => String((x && (x.card_text || x.text)) || "");
  const SITE = /\b(mega ?bay ?\d?|megabay ?\d?|high ?bay|production( site)?|build site|starfactory|sanchez)\b/i;
  const PAD = /\b(pad(?:[- ]?\d)?|launch (site|mount|tower)|olm|tower|chopsticks?)\b/i;
  const NOT_PAD_RETURN = /\bafter (its )?(cryo|static|proof)|\bfrom massey|\bmassey'?s?\b.*\b(to|for)\b.*\bcryo|\bcryo\b/i;
  const AT_PAD = /\bchopsticks?\b|\blift(ed|s|ing)?\b|\bairborne\b|\bpusher\b|\bload test|\bmount(ed|ing)? on\b|\bplaced on\b|\bsqd\b|\bcatch\b|\bcaught\b/i;
  const ARRIVE = /\b(arrived|arrives|arriving|reached|is (now )?at|now at|returned to|back (at|in|inside))\b/i;
  const DEPART = /\b(headed|heading|rolled|rolling|rolls|moved|moving|left|leaving|departed|en route|on (its|the) way|returning|transported|transporting|rolled back)\b/i;
  const padName = (t) => { const m = String(t || "").match(/\bpad[- ]?(\d)\b/i); return m ? `Pad ${m[1]}` : null; };
  function classify(t) {
    const s = String(t || "");
    const back = /\b(back|returned|returning|return)\b/i.test(s);
    if (back && SITE.test(s) && !NOT_PAD_RETURN.test(s)) return { kind: "from_pad", phase: ARRIVE.test(s) ? "arrive" : "depart" };
    if (!back && PAD.test(s) && (ARRIVE.test(s) || DEPART.test(s)) && !AT_PAD.test(s.replace(/\bfor chopstick (tests?|lifts?)\b/i, ""))) return { kind: "to_pad", phase: ARRIVE.test(s) ? "arrive" : "depart" };
    if (AT_PAD.test(s) && !/\bcryo\b|\bmassey/i.test(s)) return { kind: "at_pad", phase: null };
    return { kind: null, phase: null };
  }
  const vehOf = (h) => { const hw = String((h && h.hardware) || "").toUpperCase().replace(/^SHIP\s*/, "S").replace(/^BOOSTER\s*/, "B"); return /^[SB]\d+$/.test(hw) ? hw : null; };
  const vehName = (v) => (/^S/.test(v) ? `Ship ${v.slice(1)}` : `Booster ${v.slice(1)}`);
  // every post of a vehicle: each history entry's own post and its updates
  function postsOf(road, v) {
    const out = [];
    for (const c of (road && road.categories) || []) {
      if (!BOXES.includes(c.id)) continue;
      for (const h of c.history || []) {
        if (!h || vehOf(h) !== v || h.feed_hide || h.trust === "unconfirmed") continue;
        out.push({ cid: c.id, entry: h, post: h, own: true, ...classify(txt(h)) });
        for (const u of h.updates || []) if (u && u.text) out.push({ cid: c.id, entry: h, post: u, own: false, ...classify(txt(u)) });
      }
    }
    return out.sort((a, b) => T(a.post) - T(b.post));
  }
  // trips: start at a to_pad post, run through at_pad posts, end with the return (and its same-return tail)
  function tripsOf(posts) {
    const trips = [];
    for (let i = 0; i < posts.length; i++) {
      if (posts[i].kind !== "to_pad") continue;
      const start = T(posts[i].post), mem = [posts[i]]; let ret = null, j = i + 1;
      for (; j < posts.length; j++) {
        const p = posts[j], t = T(p.post);
        if (t - start > TRIP_MAX_D * 864e5) break;
        if (ret) { if (p.kind === "from_pad" && t - ret <= RETURN_TAIL_H * 36e5) { mem.push(p); continue; } break; }
        if (p.kind === "to_pad" || p.kind === "at_pad") mem.push(p);
        else if (p.kind === "from_pad") { mem.push(p); ret = t; }
      }
      if (mem.some((p) => p.kind === "at_pad") || ret) trips.push({ members: mem, start, end: T(mem[mem.length - 1].post), returned: !!ret });
      i = j - 1;
    }
    return trips;
  }
  // same-move duplicates: same move + phase within MERGE_H → the earliest stays, the rest go in its merged list
  function mergeMoves(rows) {
    const out = [];
    for (const r of rows.slice().sort((a, b) => T(a) - T(b))) {
      const c = classify(txt(r));
      const dup = (c.kind === "to_pad" || c.kind === "from_pad") && out.find((o) => o._k === c.kind + "|" + c.phase && T(r) - T(o) <= MERGE_H * 36e5);
      if (dup) { dup.merged = [...(dup.merged || []), { text: r.text, at: r.at, url: r.url }]; continue; }
      out.push({ ...r, _k: c.kind ? c.kind + "|" + c.phase : null });
    }
    return out.map(({ _k, ...r }) => r);
  }
  const LIFT = /\bchopsticks?\b.*\blift|\blift.*\bchopsticks?\b|\blifted .*\btower\b/i;
  function headlineOf(trip) {
    const at = trip.members.filter((p) => p.kind === "at_pad");
    const pick = at.find((p) => p.own && LIFT.test(txt(p.post))) || at.find((p) => p.own) || at.find((p) => LIFT.test(txt(p.post))) || at[0] || null;
    return pick;
  }
  function applyToRoad(road) {
    if (!road || !Array.isArray(road.categories)) return road;
    const vs = new Set();
    for (const c of road.categories) for (const h of c.history || []) { const v = vehOf(h); if (v && BOXES.includes(c.id)) vs.add(v); }
    let cats = road.categories.map((c) => ({ ...c, history: (c.history || []).slice() }));
    let changed = false;
    for (const v of vs) {
      for (const trip of tripsOf(postsOf({ categories: cats }, v))) {
        const head = headlineOf(trip);
        if (!head) continue;
        const entries = [...new Set(trip.members.map((p) => p.entry))];
        const ownIn = (e) => trip.members.some((p) => p.own && p.entry === e);
        const fold = entries.filter(ownIn); // an entry joins the trip when its own post is part of it
        if (fold.length < 2 && fold[0] && fold[0].pad_trip) continue; // already folded
        const he = head.entry;
        const pad = trip.members.map((p) => padName(txt(p.post))).find(Boolean);
        const headText = LIFT.test(txt(head.post)) ? `${vehName(v)} lifted on the chopsticks${pad ? " at " + pad : ""}.` : txt(head.post);
        const rows = [];
        for (const e of fold) {
          if (e !== he || !head.own) rows.push({ text: e.text, ...(e.card_text ? { card_text: e.card_text } : {}), at: e.at, date: e.date, url: e.url, src: e.src });
          for (const u of e.updates || []) if (u && u.text && u !== head.post) rows.push(u);
        }
        const updates = mergeMoves(rows.filter((r) => !(r.url && r.url === head.post.url)));
        const folded = { ...he, ...(head.own ? {} : { at: head.post.at, date: head.post.date, url: head.post.url, src: head.post.src, x_post: undefined, media_override: undefined }),
          text: headText, card_text: headText, x_text: headText, updates, trip_order: "chrono",
          pad_trip: { vehicle: v, pad: pad || null, start: new Date(trip.start).toISOString(), end: new Date(trip.end).toISOString(), returned: trip.returned, members: fold.map((e) => e.id) } };
        const drop = new Set(fold);
        cats = cats.map((c) => ({ ...c, history: c.history.filter((h) => !drop.has(h)) }));
        const pc = cats.find((c) => c.id === "pad");
        if (pc) pc.history = [folded, ...pc.history].sort((a, b) => T(b) - T(a));
        changed = true;
      }
    }
    return changed ? { ...road, categories: cats } : road;
  }
  return { classify, tripsOf, postsOf, mergeMoves, applyToRoad, MERGE_H, TRIP_MAX_D };
});
