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

## Telegram enrichment final review

Date: 2026-10-16

- Commit: `26176fc fix: address final telegram enrichment review`
- Root TypeScript excludes `scripts`, `mobile`, and `studio-cnd`, so Telegram scripts using explicit `.ts` imports do not enter the Next.js typecheck.
- CLI argument validation rejects `--only` when its product name is missing or another flag follows it.
- Telegram test coverage now includes the CLI validation regression cases.
- Mobile product mapping filters null and empty gallery URLs.

Verification:

- `npm run test:telegram-enrich` — PASS, 8 suites / 18 tests.
- `npx tsc --noEmit` — PASS.
- `cd mobile; npm test -- --runInBand __tests__/map-content.test.ts` — PASS, 1 suite / 5 tests.
- IDE diagnostics for changed TypeScript files — no errors.
