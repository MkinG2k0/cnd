# Final branch review fixes

Date: 2026-10-13

- Commit: `4531718 fix(mobile): address final review findings`
- Detail screen keeps the product visible when site settings fail and hides unavailable contact actions.
- Quiz consent uses one `Switch` handler.
- Favorites initialization reaches `ready=true` after storage rejection.
- Favorite slugs are trimmed before toggling, with regression coverage.
- Push registration requires an EAS project ID, persists the last token under `cnd.push.token`, and README documents the MVP token-collection limitation without claiming a backend.
- Removed the unused Expo template modal.

Verification:

- `cd mobile; npm test -- --runInBand` — PASS, 6 suites / 22 tests.
- `cd mobile; npx tsc --noEmit` — PASS.
- `git diff --check` — PASS (Git only reported expected LF-to-CRLF working-copy warnings).
