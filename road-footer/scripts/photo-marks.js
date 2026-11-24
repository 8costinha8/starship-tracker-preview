/* Source marks burned into photos (24 Nov v5). Pure; Node (require) and browser (window.PhotoMarks).
   Rule: a card photo that already shows its source's logo / watermark in the visible crop does not also get the round
   source badge (two logos on one picture). The badge stays when the mark is cropped out, or the photo has no mark.
   Marks are recorded per image (handle + the mark's box as fractions of the full image, x0 y0 x1 y1): no automatic logo
   detection, a new marked photo needs its entry here (scripts/test-photo-marks.js checks each entry against its crop). */
(function (root, factory) { if (typeof module === "object" && module.exports) module.exports = factory(); else root.PhotoMarks = factory(); })(typeof self !== "undefined" ? self : this, function () {
  // 24 Nov v6: empty. The RGV livestream thumb (B24 cryo, RGV logo top right) is no longer on any card: Bernardo's pick
  // (images/b24-cryo-blobifie-nsf-clean.jpg) replaced it, and that crop has no NSF mark left (timestamp bar and ticker cut).
  // Entry shape: { match: "<part of the image url>", handle: "<X handle of the mark>", w, h, box: [x0, y0, x1, y1] }
  const MARKS = [];
  const markOf = (image, marks = MARKS) => (image ? marks.find((m) => String(image).includes(m.match)) || null : null);
  // visible window of a cover-cropped image, in fractions of the image: centred across, top / bottom / centre down
  function windowOf(w, h, aspect, crop) {
    const ia = w / h; let x0 = 0, x1 = 1, y0 = 0, y1 = 1;
    if (ia > aspect) { const f = aspect / ia; x0 = (1 - f) / 2; x1 = x0 + f; }
    else if (ia < aspect) { const f = ia / aspect; if (crop === "bottom") { y0 = 1 - f; } else if (crop === "center") { y0 = (1 - f) / 2; } y1 = y0 + f; }
    return [x0, y0, x1, y1];
  }
  // share of the mark's area inside the visible window
  function shown(mark, aspect, crop) {
    const [a0, b0, a1, b1] = windowOf(mark.w, mark.h, aspect, crop), [x0, y0, x1, y1] = mark.box;
    const iw = Math.max(0, Math.min(x1, a1) - Math.max(x0, a0)), ih = Math.max(0, Math.min(y1, b1) - Math.max(y0, b0));
    return (iw * ih) / ((x1 - x0) * (y1 - y0));
  }
  // hide the round badge when at least a third of the source's mark is on screen (a cut logo still reads as a logo)
  const SHOWN_MIN = 1 / 3;
  const hideBadge = (image, aspect = 16 / 9, crop = "top", marks = MARKS) => { const m = markOf(image, marks); return !!m && shown(m, aspect, crop) >= SHOWN_MIN; };

  /* 24 Nov v6 credit rule (Bernardo): the round badge is the photo's CREDITED ORIGINAL SOURCE when the post names one, and
     the posting account only when there is none. Credited = (1) a burned-in mark recorded above that is in the crop, else
     (2) the post's own credit: "📸 / 📷 / 🎥 X", "photo(s) by X", "photo: X", "credit: X", "via @X", or a line "For X".
     In a credit, a named agency with a known account wins (the logo is the agency's: "For WAI Media @FelixSchlang",
     "📷 Oct 23. @Jordanguidry6 - WAI Media" → @FelixSchlang; "📷NSF | Starbase Live" → @NASASpaceflight), then the first
     @handle; a name with no known account ("📸Avidspace") falls back to the poster (reported, not guessed). */
  const ORGS = [
    [/\bWAI\s*Media\b/i, "FelixSchlang"],
    [/\b(?:NSF|NASA\s?Spaceflight|Starbase\s+Live)\b/i, "NASASpaceflight"],
    [/\bStarship\s+Tracking\b/i, "TrackingTheSB"],
    [/\bLabPadre\b/i, "LabPadre"],
    [/\bRGV\s+Aerial\b/i, "RGVaerialphotos"],
  ];
  const unesc = (t) => String(t || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  function creditLines(text) {
    const t = unesc(text), out = [];
    for (const m of t.matchAll(/(?:📸|📷|🎥)\s*:?\s*([^\n]*)/gu)) out.push(m[1]);
    for (const m of t.matchAll(/\b(?:photos?\s+by|photo\s*:|credit\s*:|image\s+by)\s*([^\n]*)/giu)) out.push(m[1]);
    for (const m of t.matchAll(/\bvia\s+(@\w{1,15})/giu)) out.push(m[1]);
    for (const m of t.matchAll(/(?:^|\n)\s*for\s+([^\n]{1,60})/giu)) if (/@\w|\b[A-Z][\w]*\s+Media\b/.test(m[1]) || ORGS.some(([re]) => re.test(m[1]))) out.push(m[1]);
    return out.map((l) => l.replace(/https?:\/\/\S+/g, " ").replace(/#\w+/g, " ").trim()).filter(Boolean);
  }
  // → { handle, via: "mark" | "credit" | "poster", name? } (handle without "@")
  function creditOf(text, { poster = "", image = null, aspect = 16 / 9, crop = "top", marks = MARKS } = {}) {
    const p = String(poster || "").replace(/^@/, "");
    const m = markOf(image, marks); if (m && shown(m, aspect, crop) >= SHOWN_MIN) return { handle: m.handle, via: "mark" };
    for (const line of creditLines(text)) {
      const org = ORGS.find(([re]) => re.test(line)); if (org) return { handle: org[1], via: "credit", name: (line.match(org[0]) || [])[0] };
      const h = line.match(/@(\w{1,15})/); if (h) return { handle: h[1], via: "credit" };
      return { handle: p, via: "poster", name: line.split(/\s*\|\s*/)[0].trim(), unresolved: true }; // named, no known account
    }
    return { handle: p, via: "poster" };
  }
  return { MARKS, markOf, windowOf, shown, hideBadge, SHOWN_MIN, ORGS, creditLines, creditOf };
});
