# Feel variants (Tusk, 21 Nov 2026), sandbox only
Hub: index.html. Each variant is a full app copy of base-21nov (live c29c909, with push, Firebase and the service worker stubbed).
- calm/ = A Calm Mission Control (DaVinci's lead; most polished). energy/ = B Live Launch Energy. native/ = C Apple-native.
- Applied to every variant from ../patches: cleanup-bugB-swipelock-xfade, cleanup-bugA-nopinch, pipeline-photo-credit, pipeline-about-truth. pipeline-f16-data-fixes was NOT applied, so the data matches base.
- Per variant: variant.css (loads after #root, so it wins over the in-app styles), variant.js (sets window.VARIANT, plus the shared core from _tools/core.js and the variant's behaviours), and small app.js hooks (_tools/patch_app.py): EXPAND_MS / HDR_K from VARIANT, swipe exclusion for carousels and sheets, sheet mode skips the in-list scroll choreography, and DaVinci #3 collapses the TBC rows.
- Variant fix for the bugB patch: cancelDrag() never cleared feed-on when the drag started on Page 1 (feedOpen was already false), so .st-wrap kept a transform layer. That trapped position:fixed children. Fixed here with a setFeedOn(false) timeout. **The same fix is needed in sandbox/app.**
- Dropped: html,body{overscroll-behavior-y:none}. It blocked all page scrolling in Chromium in the native variant.
- Review assets: compare/ (side-by-side JPGs, per-variant PNGs, interactions.webm, interact*.json). Tools: _tools/ (shoot.py, interact.py, ld.py launch-day fixture, compare.py). Raw shots: _shots/.
- Not tested on a real iPhone.

## D · HIG rulebook + creative motion (added 21 Nov 2026, 18:51 UK)
- App: `hig/index.html`. Rulebook with pass/fail per rule: `hig/HIG-RULES.md` (and `.html`). HIG source text: `hig/_hig-src/`. Raw test output: `hig/_verify/`, `_shots/hig/audit.json`.
- C is kept but relabelled "iOS look (superseded)".
- Tools added: `_tools/anim.py` (motion checks), `anim_video.py` (animation clip), `a11y.py`, `titles.py`.
- Clip: `compare/hig/animations.webm`. Not embedded in the hub (no `<video>`), only linked.
- Not tested on a real iPhone or Safari.
