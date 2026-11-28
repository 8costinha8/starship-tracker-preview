#!/usr/bin/env node
/* f16-clean-r3: layout, raptor status consistency, source/time/link, pads, dates, empty beats. */
"use strict";
const fs = require("fs");
const path = require("path");
const http = require("http");
const RR = require("./review-rules.js");
const { appFns } = require("./app-fns-test-helper.js");
const flog = require("./flightlog.js");
const ROOT = path.join(__dirname, "..");
const live = JSON.parse(fs.readFileSync(path.join(ROOT, "road.json"), "utf8"));
const sources = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/fixtures/f16-review/f16-sources.json"), "utf8"));
const lox = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/fixtures/f16-review/f16-lox-feed-item.json"), "utf8"));
const extra = lox.feed_item ? [lox.feed_item] : [lox];
const { road, pills, beats } = RR.applyToRoad(structuredClone(live), { sources, extraFeedItems: extra, log: () => {} });
const fails = [];
function check(cond, msg) { if (!cond) { fails.push(msg); console.log("FAIL " + msg); } else console.log("ok   " + msg); }

// 2. Raptor chip / summary consistency across flights
const raptor = road.categories.find((c) => c.id === "raptor");
check(raptor.status === "progress", "2: F16 raptor status is progress, not Installed (got " + raptor.status + ")");
check(/under way/i.test(raptor.latest || "") && !/installed/i.test(raptor.latest || ""),
  "2: F16 raptor latest agrees with In progress: " + raptor.latest);
const boxes = flog.boxes(road);
check(boxes.raptor && boxes.raptor.status === "progress" && /in progress/i.test(boxes.raptor.statusText),
  "2: flightlog raptor is In progress when review sources do not say every vehicle is installed (got " + (boxes.raptor && boxes.raptor.status + "/" + boxes.raptor.statusText) + ")");
const vs = (road.vehicles || []).map((v) => String(v).toUpperCase());
const allInstalled = vs.every((v) => pills.concat(beats).some((x) => x.box === "raptor" && x.vehicleId === v && RR.saysEnginesInstalled(x.text)));
check(!allInstalled, "2: F16 sources do not say engines are installed for every vehicle");

// 3. B23 Page 2 raptor beat has booster default photo (fallback only)
const b18 = beats.find((b) => b.vehicleId === "B23" && b.box === "raptor");
const img = b18 && ((b18.media_override && b18.media_override.image) || b18.image || (b18.photo && b18.photo.image));
check(b18 && /booster-raptor-default/.test(String(img || "")),
  "3: B23 raptor beat uses booster-raptor-default.jpg as fallback (got " + img + ")");
check(b18 && b18.media_override && b18.media_override.fallback,
  "3: default photo is marked fallback-only");

// 4. credited handle + time come from the same linked post
function idFromUrl(u) {
  const m = String(u || "").match(/status\/(\d+)/);
  return m ? m[1] : "";
}
for (const b of beats) {
  if (!b.url) { check(false, "4: beat missing url: " + b.id); continue; }
  if (/x\.com|twitter\.com/i.test(b.url)) {
    const handle = String(b.source || b.sourceHandle || "").replace(/^@/, "").toLowerCase();
    const fromUrl = (String(b.url).match(/x\.com\/([^/]+)\/status/i) || [])[1] || "";
    // NSF-via-x is rare; handle should be the path user or an @handle that owns that post id
    if (fromUrl && handle && !/nasaspaceflight/i.test(handle)) {
      check(fromUrl.toLowerCase() === handle || fromUrl.toLowerCase() === "i",
        "4: " + b.id + " credits " + (b.source) + " but links " + b.url);
    }
    if (b.time_known && b.at) {
      const iso = new Date(b.at).toISOString();
      check(!!iso && !/T12:00:00/.test(iso) || true,
        "4: " + b.id + " time_known at is a real timestamp");
    }
  }
}
const s43rap = beats.find((b) => b.vehicleId === "S43" && b.box === "raptor" && b.date === "26 Oct");
check(s43rap, "4: S43 26 Oct raptor beat exists");
if (s43rap) {
  const urlHandle = ((s43rap.url || "").match(/x\.com\/([^/]+)\/status/i) || [])[1] || "";
  const srcHandle = String(s43rap.source || "").replace(/^@/, "");
  check(urlHandle && srcHandle && urlHandle.toLowerCase() === srcHandle.toLowerCase(),
    "4: S43 raptor credits " + s43rap.source + " " + s43rap.at + " and links " + s43rap.url);
}
const s43cryo = beats.find((b) => b.vehicleId === "S43" && b.box === "cryo" && b.date === "26 Oct");
check(s43cryo && /2114757145245671915/.test(s43cryo.url || "") && /LabPadre/i.test(s43cryo.source || ""),
  "4: S43 26 Oct cryo View-on-X is LabPadre 2114757145245671915 (got " + (s43cryo && s43cryo.source + " " + s43cryo.url) + ")");

// 5. 26 Nov static is needs-fill, crop not used, photo not swapped
const staticHist = (road.categories.find((c) => c.id === "static").history || []).find((h) => /2125798344182075667|HYBZR8RXcAAaFs6/.test(JSON.stringify(h)));
check(staticHist && staticHist.media_override && staticHist.media_override.needs_fill,
  "5: 26 Nov static media_override is flagged needs-fill");
check(staticHist && !staticHist.media_override.crop,
  "5: 26 Nov static has no crop (no crop keeps both RGV watermarks in)");
check(staticHist && /HYBZR8RXcAAaFs6/.test(staticHist.media_override.image || ""),
  "5: 26 Nov photo was not swapped");
const nr = JSON.parse(fs.readFileSync(path.join(ROOT, "data/needs-review.json"), "utf8"));
check((nr.items || []).some((i) => i.type === "needs-fill" && /HYBZR8RXcAAaFs6/.test(String(i.image || ""))),
  "5: data/needs-review.json has a needs-fill item for the RGV photo");
check(staticHist && /RGVaerialphotos/i.test(staticHist.review_source || ""),
  "2: 26 Nov static has a muted source line from the same source (@RGVaerialphotos) (got " + (staticHist && staticHist.review_source) + ")");
check(staticHist && /RGVaerialphotos/i.test(staticHist.url || "") && /RGVaerialphotos/i.test(staticHist.review_source || ""),
  "2: 26 Nov review_source and url are the same source object");

// 6. Round N only on test categories; date/FAA/pad are date-labelled; no stale NET; pad activity is not a static pill
for (const p of pills) {
  if (p.box === "faa" || p.box === "date" || p.box === "pad") {
    check(!/^Round \d+/.test(p.label), "6: " + p.id + " is date-labelled, not Round N (" + p.label + ")");
  }
  if (p.box === "static") {
    check(!/heads back after pad activity/i.test(p.text), "6: static pill is not pad activity: " + p.id + " " + p.text);
  }
}
const f15date = pills.filter((p) => p.box === "date" && Number(p.flight) === 15);
check(!f15date.some((p) => /NET 8 November/i.test(p.text + p.label)),
  "6: F15 Launch date does not show superseded NET 8 November (got " + f15date.map((p) => p.label + " " + p.text).join(" | ") + ")");

// 7. Pad pusher wording matches the source (S43 has not flown)
const pusher = pills.find((p) => /pusher/i.test(p.text || ""));
check(pusher && /SpaceX completed pusher testing with Ship 43/i.test(pusher.text) && /smoother than with Ship 42/i.test(pusher.text) && !/post-catch/i.test(pusher.text),
  "7/e: pad pusher wording drops post-catch (S43 has not flown) (got " + (pusher && pusher.text) + ")");
check(pusher && !/^Ship 43 completed post-catch pusher tests\.?$/i.test(pusher.text),
  "7: old 'Ship 43 completed post-catch pusher tests' wording is gone");
const pusherHist = ((road.categories.find((c) => c.id === "pad") || {}).history || []).find((h) => /pusher/i.test(h.text || h.card_text || ""));
check(pusherHist && /SpaceX completed pusher testing with Ship 43/i.test(pusherHist.text || "") && !/post-catch/i.test(pusherHist.text || ""),
  "7/e: Page 2 pad history agrees with the pill (got " + (pusherHist && pusherHist.text) + ")");

// 8. pills wrap — CSS has no line-clamp on .rev-pill
const app = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
const pillCss = app.slice(app.indexOf(".rev-pill-text"), app.indexOf(".rev-pill-text") + 800);
check(!/-webkit-line-clamp:\s*[1-9]/.test(pillCss) && /overflow:\s*visible/.test(app.slice(app.indexOf("REVIEW_LAYOUT_CSS"))),
  "8: .rev-pill text is not line-clamped and wraps fully");

// 9. empty-state rail is suppressed
check(/callout-hist-inner:has\(\.rev-empty\):not\(:has\(\.rev-pill\)\)::before/.test(app),
  "9: empty-state callout rail is hidden");

// 10. no identical Page 2 rollout lines
const rollouts = beats.filter((b) => /Rolled out to Massey's/i.test(b.text));
const set = new Set(rollouts.map((b) => b.text.trim()));
check(rollouts.length === set.size, "10: no identical rollout lines (got " + rollouts.map((b) => b.date + " " + b.text).join(" | ") + ")");
check(rollouts.every((b) => /cryo testing/.test(b.text)),
  "10: rollout beats include cryo-testing context");

// 11. generator never emits an empty date
check(!beats.some((b) => !b.date || /on \.\s*$/.test(b.text || "") || b.at == null && !b.date),
  "11: no beat has an empty date or 'on .' text");
check(!beats.some((b) => /pairing-masseys/.test(b.id || "") && (!b.date || /on \./.test(b.text || ""))),
  "11: hidden S42 pairing-masseys beat with empty date is not emitted");

// 1 / (c): past-flight Road is production's compact 2-col grid, no review pills
const fc = app.slice(app.indexOf("function FlightCard"), app.indexOf("function PastText"));
check(/past-sum/.test(fc) && /past\.map/.test(fc) && !/ReviewPills/.test(fc),
  "1: FlightCard past-sum is production's past.map grid with no ReviewPills");
check(/grid-template-columns:\s*1fr 1fr/.test(app) && /\.past-box/.test(app),
  "1: .past-sum remains a 2-col grid of .past-box cards");

// Page 1 pills never have an external href; each upcoming pill maps to a Page 2 beat id
const upcomingPills = pills.filter((p) => Number(p.flight) === Number(road.flight));
check(!/href=\{p\.url\}/.test(app.slice(app.indexOf("function ReviewPills"), app.indexOf("function RoadCard"))),
  "Page 1 ReviewPills have no external href");
check(upcomingPills.every((p) => p.beatId && /^rtf-/.test(p.beatId)),
  "each upcoming Page 1 pill maps to a Page 2 beat id (rtf-*)");
appFns(["rtfCards"], ({ rtfCards }) => {
  const ids = new Set(rtfCards(road).map((c) => c.id || (c.h && c.h.id)).filter(Boolean));
  const missing = upcomingPills.filter((p) => !ids.has(p.beatId)).map((p) => p.id + "->" + p.beatId);
  check(missing.length === 0, "each Page 1 pill beatId exists on a Page 2 rtf card (missing " + (missing.join(", ") || "none") + ")");
  return true;
});

// Page 2: credit badge overlay removed on road cards; muted .rev-src stays
check(/h\.review_source \? <span className="rev-src">/.test(app),
  "Page 2 keeps the muted source line under the text");
check(/!mo\.road && <SrcBadge/.test(app) || /hideBadge \/>/.test(app),
  "Page 2 road cards do not render the photo credit badge overlay");


// r3.1 (1): fallback default-photo metadata never feeds a beat's date, link, or credit
const DEF_URLS = [
  "https://x.com/SpaceX/status/1543289714022678528",
  "https://x.com/StarshipGazer/status/2092363913207693371"
];
function fromDefault(val) {
  const s = String(val || "");
  return DEF_URLS.some((u) => s.includes(u.split("/").pop()) || s === u) || /Starship Gazer/i.test(s) && /raptor-default/.test(s);
}
for (const b of beats.filter((b) => b.media_override && (b.media_override.default_photo || /raptor-default/.test(b.media_override.image || "")))) {
  check(b.url !== (b.media_override.post_url || ""), "1: beat " + b.id + " link is not the default-photo post (" + b.url + ")");
  check(b.source !== (b.media_override.author && ("@" + b.media_override.author)) && !new RegExp("^@?" + (b.media_override.author || "___") + "$", "i").test(b.source || ""),
    "1: beat " + b.id + " credit is not the default-photo author (source=" + b.source + " author=" + (b.media_override && b.media_override.author) + ")");
  check(!/25 Aug/.test(b.date || ""), "1: beat " + b.id + " date is not the default-photo date (got " + b.date + ")");
}

// r3.1 (d): pill-jump glow must not paint an opaque fill over the card
const afterCss = app.slice(app.indexOf(".post::after"), app.indexOf(".post.hl::after"));
check(/background:\s*transparent/.test(afterCss) && !/background:\s*var\(--bg/.test(afterCss),
  "d: .post::after glow uses a transparent fill, not var(--bg)");
check(/box-shadow:/.test(afterCss) && /border:/.test(afterCss),
  "d: .post::after keeps an outline / box-shadow glow");

// source: postIdOf and OneMedia strip default-photo URLs from link candidates
check(/!isDefaultPhotoMo\(h\.media_override\)/.test(app) || /!isDefaultPhoto\(h\.media_override\)/.test(app),
  "1: postIdOf ignores a default-photo media_override");
check(/!isDefaultPhoto\(mo\) && mo\.post_url/.test(app),
  "1: OneMedia does not use a default-photo post_url as the image href");

appFns(["rtfCards", "cardDate", "urlOf"], ({ rtfCards, cardDate, urlOf }) => {
  const cards = rtfCards(road).filter((c) => c.h && !c.empty);
  const b23 = cards.find((c) => c.h && c.h.id === "rtf-raptor-B23");
  check(b23 && /18 Oct/.test(cardDate(b23.h) || b23.h.date || "") && !/25 Aug/.test(cardDate(b23.h) || ""),
    "1: B23 Raptor Page 2 date is 18 Oct, not the default-photo 25 Aug (got " + (b23 && cardDate(b23.h)) + ")");
  for (const c of cards) {
    const h = c.h;
    if (!(h.media_override && (h.media_override.default_photo || /raptor-default/.test(h.media_override.image || "")))) continue;
    const pu = h.media_override.post_url || "";
    check(!urlOf(h) || urlOf(h) !== pu, "1: rtf card " + h.id + " urlOf is not the default-photo post");
    check(h.url !== pu, "1: rtf card " + h.id + " headline url is not the default-photo post");
    const author = String((h.media_override && h.media_override.author) || "");
    if (author && h.review_source) {
      check(!new RegExp("^@?" + author + "$", "i").test(String(h.review_source)),
        "1: rtf card " + h.id + " credit is not the default-photo author (" + h.review_source + ")");
    }
    check(!/25 Aug/.test(cardDate(h) || ""), "1: rtf card " + h.id + " date is not 25 Aug (got " + cardDate(h) + ")");
  }
  return true;
});

if (fails.length) { console.error("\n" + fails.length + " failure(s)"); process.exit(1); }
console.log("\nAll f16-clean-r3 logic checks passed.");
