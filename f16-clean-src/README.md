# F16 clean review — checker source (preview only)

This tree is the review pipeline used to generate `/f16-clean/road.json`.

- Base: live production `road.json` plus recorded fixture posts as extra source inputs (`road.review.base` = `live-production-road+extra-sources`).
- Run offline (no network):

      node scripts/run-review-offline.js --out preview-out/road.json

  from a checkout that also has production `road.json` and `tests/fixtures/f16-review/`.

- Tests: `scripts/test-f16-review.js`, `scripts/test-f16-review-photos.js`, `scripts/test-f16-p1-drawers.js` (wired in `tests/suites.json` logic). Official runner: `node scripts/run-tests.js --suite default --offline --history <tree>`.

Do not use this to write production `8costinha8/starship-tracker` or send FCM.
