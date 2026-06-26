# Kin OCR

A small Angular app for the **Kinsurance OCR** challenge. A scanning machine exports a CSV
of policy numbers; this app lets a user upload that CSV, view the numbers in a table, and
(in later stories) validate and submit them.

Built on the provided Angular 21 boilerplate. The work is delivered story by story, each on
its own branch and squash-merged into `main`.

| User story | Scope | Status |
| ---------- | ----- | ------ |
| **US1** | Upload a CSV (validated: CSV type, ≤ 2 MB) and list the policy numbers in a table | ✅ Done |
| **US2** | Validate each number via a mod‑11 checksum and show valid/invalid status | ⏳ Planned |
| **US3** | POST the processed array to a mock API and report success/failure with the returned id | ⏳ Planned |
| **US4** | Auto‑correct mis‑scanned digits (`valid` / `corrected` / `AMB` / `error`) | 📝 Outline only — to be paired on (`docs/user-story-4-approach.md`, to be added) |

---

## Tech stack

- **Angular 21**, standalone components, OnPush change detection
- **Signals** for state (a small signal‑based store) — see [Design decisions](#design-decisions--assumptions)
- **Vitest** for unit tests (migrated off the boilerplate's deprecated Karma)
- **Playwright** for end‑to‑end tests
- **lucide-angular** for icons (no emoji)
- **SCSS** with the provided color‑palette CSS variables plus Kin design tokens
  (typography, spacing, radius) in `src/styles.scss`

## Prerequisites

- **Node `v22`** (pinned in `.nvmrc`; CI uses it). Angular 21 supports Node `^20.19`, `^22.12`,
  or `^24` — **not** the odd‑numbered v25. If you use a version manager:
  ```bash
  fnm use      # or: nvm use
  ```
- **npm** ≥ 9.6.7

## Install

```bash
npm install
```

## Run

```bash
npm start
```
Then open <http://localhost:4200>. Use `./sample-files/sample.csv` as input.

### Sample files

`sample-files/` holds CSVs for exercising each upload path by hand:

| File | Demonstrates |
| ---- | ------------ |
| `sample.csv` | Successful upload — 10 policy numbers listed in the table |
| `sample-empty.csv` | A valid `.csv` with no values → "did not contain any policy numbers" |
| `sample-too-large.csv` | ~2.1 MB file → rejected by the 2 MB size limit |

(The Playwright suite uses its own copies under `e2e/fixtures/`.)

## Test

```bash
npm test       # Vitest unit tests (headless, single run)
npm run e2e    # Playwright end-to-end tests (starts/reuses the dev server)
```
The first `npm run e2e` will download the Chromium browser if it isn't already installed
(`npx playwright install chromium`).

## Build

```bash
npm run build  # production build to dist/kin-ocr
```

---

## Project structure

```
src/app/
  models/policy.model.ts              # PolicyRecord interface
  services/csv-parser.service.ts      # hand-rolled CSV → string[] tokens
  store/policy-store.service.ts       # signal-based state (single source of truth)
  components/
    alert/                            # status message (success/warning/error variants)
    button/                           # appButton directive + global button styles
    file-upload/                      # accessible CSV input + validation
    panel/                            # labelled-region card with BEM variant classes
    policy-table/                     # responsive results table
  app.component.*                     # thin orchestrator: upload → parse → store → table
e2e/                                  # Playwright specs (*.e2e.ts) + fixtures
sample-files/                         # sample CSVs for manual testing (success/empty/oversize)
```

Data flow is one‑directional: the upload component emits a validated `File` (or a validation
error); the orchestrator reads and parses it; the store holds the result as signals; the
table renders from the store. Each later story adds a service/signal rather than reshaping
this flow.

## Design decisions & assumptions

- **Policy numbers are stored as `string`, not `number`.** They are fixed‑width 9‑digit
  identifiers where leading zeros are significant (e.g. `000011111`), and US2's checksum is
  positional over the digit string. A JS `number` would drop leading zeros and risk
  precision issues. (Trade‑off: callers must not do arithmetic on them — which we never do.)
- **Hand‑rolled CSV parser over a library.** The export is a single line (or one value per
  line) of plain numbers — no quoting/escaping — so a tiny, dependency‑free, fully‑tested
  parser is clearer and lighter. If the format ever gained quoted fields or embedded commas,
  a dedicated library (e.g. PapaParse) would be the right call.
- **Signals over RxJS** for state. The state here is local and synchronous; signals keep the
  store terse and the components free of subscriptions. RxJS would shine if we introduced
  streams/async orchestration (US3's HTTP call is a single request, handled simply).
- **Vitest over Karma/Jasmine.** Karma is deprecated by the Angular team; Angular 21 ships a
  built‑in Vitest runner (`@angular/build:unit-test`). Vitest is faster and ESM‑native. The
  existing Jasmine‑style specs run unchanged thanks to Vitest's compatible matchers.
- **Validation assumption (US1):** a file counts as CSV if its extension is `.csv` or its
  MIME type is a known CSV type; the size limit is 2 MB (`2 × 1024 × 1024` bytes, inclusive).
  Empty/whitespace tokens (e.g. a trailing comma) are dropped; **duplicates are preserved**
  because the scanner can legitimately read the same policy twice.
- **Unit vs e2e split.** `File.text()` is a browser API that jsdom doesn't implement, so the
  parse/load logic is unit‑tested via a text‑in method and the real file‑read path is covered
  by Playwright in a real browser.
- **`ButtonDirective` (`appButton`) over a `<app-button>` component.** A directive is
  Angular's idiomatic equivalent of React's `as` prop: the consumer applies it to the correct
  semantic element (`<button>`, `<a href>`, or — for the upload — `<label for>`) and gets
  variant/size styling, without a component re‑implementing each element's semantics. Same
  pattern as Angular Material's button. Trade‑off: its styles are global (a directive has no
  encapsulated stylesheet), which is the norm for design‑system controls.

## Accessibility & responsiveness

- Labelled file control that stays keyboard‑focusable (visually hidden, not removed), with a
  visible focus ring via `:focus-within`.
- Validation errors render in a `role="alert"` region and are wired to the input with
  `aria-describedby` / `aria-invalid`.
- Semantic results table with `<caption>` and scoped column headers; horizontal‑scroll guard
  for narrow screens; fluid spacing via `clamp()`.
- Colors come exclusively from the provided palette variables.

## Future improvements

- A parse summary (counts, duplicates) after upload.
- Surface row‑level parse warnings (e.g. tokens that aren't 9 digits) ahead of US2.
- Optional CI job for Playwright e2e (the current CI runs build + unit tests).
- Virtualized table if exports grow to thousands of rows.
