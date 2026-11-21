# HIG rulebook for the Starship Tracker (variant D)

**What this is.** Apple's Human Interface Guidelines (HIG) read from Apple's own documentation (the JSON behind developer.apple.com/design/human-interface-guidelines; text kept in `_hig-src/`). Each rule below is one the HIG gives that applies to a **web app on a phone**. The app keeps its own navy palette and Manrope font. These rules are applied, not Apple's look.

**How it was checked.** Playwright + Chrome (not Safari, not a real iPhone) at 320, 390 and 430 px wide, DPR 3, touch on. Scripts: `../_tools/audit.py`, `anim.py`, `a11y.py`, `titles.py`, `interact.py`. Raw results: `../_shots/hig/audit.json`, `_verify/anim.json`, `_verify/a11y.json`.
Run: 21 Nov 2026, 18:49 UK time.

Links go to the HIG page (Apple's pages are JS-only, so the exact paragraph is quoted instead of anchored).
Base: https://developer.apple.com/design/human-interface-guidelines/

Result key: **PASS** = measured in the browser. **PASS\*** = passes, with a caveat in the Notes. **PARTIAL** = only partly met. **FAIL** = not met.

## Layout and spacing — [layout](https://developer.apple.com/design/human-interface-guidelines/layout)

| # | Rule (what the HIG says) | 320 | 390 | 430 | Notes |
|---|---|---|---|---|---|
| L1 | Respect safe areas (content must not sit under the notch, home indicator or rounded corners) | PASS\* | PASS\* | PASS\* | `viewport-fit=cover` plus `env(safe-area-inset-*)` on all four edges is present in the CSS. **Checked by reading the CSS only.** Chrome has no notch, so the actual inset is not tested. |
| L2 | Content first: the important thing is visible without scrolling | PASS | PASS | PASS | Hero card and the start of Flight 15 are on the first screen. First card top at y = 399 of 700 (320), 385 of 844 (390, 430). |
| L3 | Consistent margins | PASS | PASS | PASS | 16 px side margin on every page. |
| L4 | Spacing on a grid | PASS\* | PASS\* | PASS\* | Spacing found: 16 / 20 / 12 / 40 / 16. All are multiples of **4**, not of 8, so this is a 4-pt grid, not a strict 8-pt one. |
| L5 | Nothing clipped or sideways-scrolling at any width | PASS | PASS | PASS | Page width equals viewport width on pages 1 and 2. |
| L6 | Adapt gracefully when space is tight (title never leaves the number alone on a line) | PASS | PASS | PASS | 15 flight titles per width: 0 with the number alone, number has same size and weight as the words (18 px / 600). Pill sits beside the title only when it fits (0 / 6 / 15 of 15 at 320 / 390 / 430). |

## Typography — [typography](https://developer.apple.com/design/human-interface-guidelines/typography)

| # | Rule | 320 | 390 | 430 | Notes |
|---|---|---|---|---|---|
| T1 | Minimum 11 pt text (default 17 pt) | PASS | PASS | PASS | 0 text nodes under 11 px across p1, open card, p2, menu. |
| T2 | Type scales with the user's text size | PASS\* | PASS\* | PASS\* | All font sizes converted from px to rem (91 declarations). With the root size at 125 %, 150 % and 200 %, there is no sideways overflow and no clipped header at any width. **Simulated by setting the root font-size**, which is not iOS Dynamic Type (iOS Safari doesn't pass that to web pages unless a page opts in). |
| T3 | Clear hierarchy through size and weight, avoid thin weights | PASS | PASS | PASS | 0 text with weight below 400. Hero 28 → card title 18 → body 15 → meta 13 → label 11. |
| T4 | Limit typefaces | PASS | PASS | PASS | One family (Manrope). |
| T5 | Keep truncation to a minimum as text grows | PASS | PASS | PASS | Nothing is cut off at 200 %: long rows wrap (Road bar drops its count to a second line, hero rows wrap). |

## Color, contrast, dark mode — [color](https://developer.apple.com/design/human-interface-guidelines/color), [dark-mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode), [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)

| # | Rule | 320 | 390 | 430 | Notes |
|---|---|---|---|---|---|
| C1 | Text contrast at least 4.5:1 (text up to 17 pt) | PASS | PASS | PASS | Lowest of ~485 text elements = **4.71:1**. Computed from real computed colours over the real background layers. |
| C2 | Same on photos | PASS\* | PASS\* | PASS\* | Text over photos sits on a dark scrim; lowest ratio against the scrim colour is 9.34:1. **Calculated from the scrim colour, not sampled from rendered pixels.** |
| C3 | Support Increase Contrast | PASS | PASS | PASS | `prefers-contrast: more` emulated: card border goes from faint to rgb(141,156,200), muted text becomes #D5DCEE. |
| C4 | Don't use colour alone to say something | PASS\* | PASS\* | PASS\* | Status pills carry words ("Success"). Road dots have the "1 of 6 done" count next to them. **Judged by reading the screens**, not automated. |
| C5 | Support both light and dark appearance | FAIL | FAIL | FAIL | Deliberate: the app has one navy, dark look and keeps it as the brand. Not implemented. |

## Accessibility — [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)

| # | Rule | 320 | 390 | 430 | Notes |
|---|---|---|---|---|---|
| A1 | Hit targets at least 44 × 44 pt | PASS | PASS | PASS | 0 interactive elements under 44 × 44 on page 1, open card, page 2 and menu. (The X-post badge is 22 px visually inside a 44 px link.) |
| A2 | Every control has an accessible name | PASS | PASS | PASS | 5 image-only links in updates had no name; D now labels them ("Open photo or video source on x.com (new tab)"). 0 unnamed after the fix. |
| A3 | Honour Reduce Motion | PASS | PASS | PASS | Emulated `prefers-reduced-motion: reduce`: 0 running animations, no ghost, no stagger, digit roll hidden, dots snap, card transitions 0 s. Glow stays as a static border, not animated. |
| A4 | Honour Reduce Transparency | PASS | PASS | PASS | Emulated: header turns solid (rgb 31,40,64), scrim 0.6 → 0.88 opacity. (The page has little blur to start with.) |
| A5 | Show where you are, and keyboard focus | PASS | PASS | PASS | Current page pill has `aria-current="page"`. `:focus-visible` outlines exist. Card heads expose `aria-expanded`. |

## Navigation, gestures, feedback — [gestures](https://developer.apple.com/design/human-interface-guidelines/gestures), [page-controls](https://developer.apple.com/design/human-interface-guidelines/page-controls), [segmented-controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls), [buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)

| # | Rule | 320 | 390 | 430 | Notes |
|---|---|---|---|---|---|
| N1 | Navigation sits in the same place on every screen | PASS | PASS | PASS | Header rectangles for the menu button and page pills are identical on Page 1 and Page 2. |
| N2 | Back is predictable | PASS | PASS | PASS | Swipe right on Page 2 returns to Page 1 (390 only, interact.py). Esc, scrim tap, Close button, swipe-down all close the menu (3 widths). Focus returns to the menu button. |
| N3 | Gestures are never the only way | PASS | PASS | PASS | Page pills do what the swipe does. Menu has a Close button. |
| N4 | A gesture must not fire the wrong action | PASS\* | PASS\* | PASS\* | Vertical scroll with a wobbling finger moved 341 px and never switched page or opened a card. No ghosted crossfade (`no_ghost: true`). Run at 390 only. |
| N5 | Standard behaviour of the page (no unexpected shrink on pull) | PASS\* | PASS\* | PASS\* | `touch-action: pan-x pan-y` on html, pull-down leaves y = 0. **Chrome can't reproduce the iOS Safari pinch/pull shrink, so only the rule is verified.** |
| F1 | Visible pressed state on every tappable | PASS | PASS | PASS | Forced `:active` on card head, menu button, page pill, Road bar, highlights link: all change (background or scale). A catch-all `:active` rule covers anything else. The "Watch live" badge wasn't on screen to test. |

## Sheets and disclosure — [sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), [disclosure-controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls)

| # | Rule | 320 | 390 | 430 | Notes |
|---|---|---|---|---|---|
| S1 | Use a sheet for a focused, self-contained task (the About menu), not for content people are browsing | PASS | PASS | PASS | About menu is a bottom sheet. Flight details stay as in-place disclosure on the card. |
| S2 | Grabber on a draggable sheet | PASS | PASS | PASS | Present. |
| S3 | Obvious way to close, in a standard place | PASS | PASS | PASS | "Close" button at top leading edge, focused on open. |
| S4 | Swipe down to dismiss | PASS | PASS | PASS | Real touch swipe (CDP) closes it at all three widths. |
| S5 | Dim what's behind, tap outside to dismiss | PASS | PASS | PASS | Scrim tap closes it. |
| S6 | Focus handled | PASS | PASS | PASS | `role=dialog`, `aria-modal`, focus moves in on open and back to the opener on close. |
| S7 | Progressive disclosure shows state (chevron rotates, `aria-expanded`) | PASS | PASS | PASS | |

## Motion — [motion](https://developer.apple.com/design/human-interface-guidelines/motion)

HIG: add motion purposefully; keep feedback brief and precise; let people cancel it; make it optional; avoid motion on interactions that happen frequently.

| # | Animation / rule | Result | Measured |
|---|---|---|---|
| M1 | Staggered list entrance, first load only | PASS | Duration 280 ms, delay 50 ms per item, max 4 items animate. Later items start at up to +150 ms, so the last one ends at **430 ms**, slightly over the 400 ms target; each single animation is 280 ms. Replays on page switch: 0. Replays on scroll: 0. Tapping a card at 60 ms, while 4 items were still entering, opened it. |
| M2 | Card open as a shared-element expand from the thumbnail | PASS | Thumbnail ghost travels 133 × 92 → 326 × 183 px, 260 ms move + 80 ms fade; ghost gone **368 ms** after start (measured). Card height animation 320 ms. Ghost has `pointer-events: none`. Touch, wheel or key press removes it (1 → 0 ghosts). Second card tapped 100 ms into the first still opened (no blocked tap, 0 ghosts left). |
| M3 | Countdown digits roll | PASS | Only the digit that changed moves, 220 ms, once per second (3 samples: 227, 202, 227 ms). Overlay text equals the real text on every sample (12/12) and sits exactly over it. Real text stays in the DOM for screen readers; overlay is `aria-hidden`. |
| M4 | Road dot fills when a milestone completes | PASS\* | 400 ms animation, class removed afterwards. **Triggered by adding `dot-done` to a dot in the DOM.** The real trigger (road.json changing, polled every 15 min) was not simulated end to end. |
| M5 | Subtle glow on launch day | PASS | With a fixture launch 4 h away: `data-v-live` set, red glow border, 400 ms bloom. With one 30 h away: no glow. Fixture only, not real launch data. |
| M6 | Bottom sheet slide | PASS | 360 ms open, 220 ms swipe-dismiss. |
| M7 | Every motion is off under Reduce Motion | PASS | See A3. |
| M8 | Cancelable, never blocks a tap | PASS | See M1, M2. |
| M9 | Avoid motion on frequent interactions | PARTIAL | The digit roll happens every second by design (you asked for it). It is small (one digit, 220 ms) and off under Reduce Motion, but the HIG says to generally avoid this. Also lowers the "purposeful" rating: the roll shows time passing, which is information, but a static count would also do. |

## Score (D, at 320 / 390 / 430)

Rules are counted once; each has the same result at all three widths unless noted.

| Result | Rules |
|---|---|
| PASS | L2, L3, L5, L6, T1, T3, T4, T5, C1, C3, A1, A2, A3, A4, A5, N1, N2, N3, F1, S1, S2, S3, S4, S5, S6, S7, M1, M2, M3, M5, M6, M7, M8 = **33** |
| PASS\* (caveat) | L1, L4, T2, C2, C4, N4, N5, M4 = **8** |
| PARTIAL | M9 = **1** |
| FAIL | C5 = **1** |
| Total | **43** |

## Things I did not verify
- No real iPhone and no Safari. Chrome only. Safe-area insets, the iOS pinch/pull behaviour, and Dynamic Type are not tested for real.
- Text-on-photo contrast comes from the scrim colour, not from pixels.
- The dot-fill is checked at DOM level only.
- Launch-day glow and digit roll used a made-up launch time that's only in the test browser.
- Edge cases: every width was tested on page 1, one open card, page 2 and the menu. Cards at positions other than the first were not individually opened at each width.
- 200 % text size fits without overflow but pages get long; the HIG asks for this level of support, not for a nice layout there.
