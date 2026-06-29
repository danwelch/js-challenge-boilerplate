# Kin OCR

A small Angular app for the **Kinsurance OCR** challenge. A scanning machine exports a CSV
of policy numbers; this app lets a user upload that CSV, view the numbers in a table, and
(in later stories) validate and submit them.

Built on the provided Angular 21 boilerplate. The work is delivered story by story.

| User story | Scope | Status |
| ---------- | ----- | ------ |
| **US1** | Upload a CSV (validated: CSV type, ≤ 2 MB) and list the policy numbers in a table | ✅ Done |
| **US2** | Validate each number via a mod‑11 checksum and show valid/invalid status | ✅ Done |
| **US3** | POST the processed array to a mock API and report success/failure with the returned id | ⏳ Planned |
| **US4** | Auto‑correct mis‑scanned digits (`valid` / `corrected` / `AMB` / `error`) | 📝 Outline only — to be paired on |

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
  services/checksum-validator.service.ts # mod-11 checksum: policy number → valid?
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

## Component design system

The components split into two tiers. **Primitives** — the directive `appButton` and the components
`app-alert` / `app-panel` (camelCase attribute selector vs. kebab-case element selectors, per Angular's
directive/component convention) — are context-free and reusable: they know nothing about CSVs or
policies. **Feature components** (`app-file-upload`, `app-policy-table`) compose those primitives for
this app's flow. New stories add feature components and extend the store; the primitives stay stable.

Variant theming is consistent across the set: each variant is reflected to a `data-*` attribute via
host bindings (not a modifier class), so stylesheets target `[data-variant=…]` and it works for bound
inputs and defaults alike — not just static string attributes.

### Primitives

**`appButton`** — directive (`button.directive.ts`)

| Input | Type | Default | Notes |
| ----- | ---- | ------- | ----- |
| `variant` | `primary \| secondary \| tertiary \| ghost` | `primary` | reflected to `data-variant` |
| `size` | `sm \| md \| lg` | `md` | reflected to `data-size` |

A directive, not a `<app-button>`, so the *consumer* picks the semantic host element —
`<button appButton>`, `<a appButton href>`, `<label appButton for>` (the upload uses the label form).
Styles are global (`button.scss`), the norm for a control applied across many host elements. Same
pattern as Angular Material's button.

**`app-alert`** — component (`alert.component.ts`)

| Input | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `variant` | `success \| warning \| error` | yes | reflected to `data-variant`; selects icon + label |

Message text is projected via `<ng-content>`. Semantics are derived from the variant: `error` →
`role="alert"` + `aria-live="assertive"`; `success`/`warning` → `role="status"` + `aria-live="polite"`.
Icons are decorative. A component (vs. a directive) because it owns its structure — icon + text — and
benefits from encapsulated styles.

**`app-panel`** — component (`panel.component.ts`)

| Input | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `title` | `string` | yes | renders the `<h2>`, wired to `aria-labelledby` |
| `subtitle` | `string` | no | optional sub-heading |

Body content is projected. Renders as a labelled landmark (`role="region"` + `aria-labelledby`) so
each panel appears in assistive-tech navigation. Deliberately variant-agnostic: a consumer tags a
panel with any `data-*` attribute and styles it from its own sheet (`app-panel[data-variant="results"]`),
keeping the panel a clean structural primitive. `subtitle` is an *input* the panel renders itself —
not a projection slot — because emulated view encapsulation can't style projected content.

### Feature components

**`app-file-upload`** — fully controlled by its inputs (`file-upload.component.ts`)

| Member | Kind | Type | Notes |
| ------ | ---- | ---- | ----- |
| `error` | input | `UploadError \| null` | error to display, driven by the store |
| `currentFile` | input | `string \| null` | when set, renders the compact "loaded" state |
| `processing` | input | `boolean` | spinner + inert form while a read is in flight |
| `fileSelected` | output | `File` | emitted when a valid CSV is chosen |
| `validationError` | output | `UploadError` | emitted when validation fails (wrong type / > 2 MB) |
| `reset` | output | `void` | user cleared the loaded file |

States: **empty** drop zone → **dragging** (drag-over highlight) → **loaded** (compact, "Choose
another file" + "Reset") → **processing** (spinner, inert) → **error** (inline `role="alert"`).
Validation lives here (it's purely about the file) but the error is *displayed* from the `error`
input, so the store stays the single source of truth. Drag-and-drop is progressive enhancement over
the keyboard/AT-accessible visually-hidden `<input>` + `<label>`.

**`app-policy-table`** — data table with sort / filter / pagination (`policy-table.component.ts`)

| Input | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `policies` | `PolicyRecord[]` | yes | renders whatever fields exist on the record |
| `loading` | `boolean` | no (default `false`) | renders a gray skeleton of the table shell instead of rows |

Story 1 shows row number + policy number; US2/US4 add columns by extending `PolicyRecord`, no contract
change. The component owns its **view** state — column sort (all three columns), a status `<select>`
filter, and pagination (5/10/25/50/100 per page) — as local signals, deriving the visible page from
`policies()` without mutating it; the store keeps only domain state. The `#` column always shows the
1‑based **scan position**, so a row traces back to the scanner output even after sorting or paging
(duplicate policy numbers are legitimate, so the displayed position isn't a stable identity). When
`loading` is set the table renders an `aria-hidden` skeleton with a polite `role="status"`
announcement — the "data is coming" state shown while an upload is processed.

### Documentation: why no Storybook (yet)

I considered Storybook to document these components and judged it disproportionate at this scale — five
components, three of them primitives a reviewer can read end-to-end in a few minutes. A heavyweight
dependency plus its own build/CI lane would add maintenance surface without unlocking understanding the
way it would in a large system, and a half-wired Storybook (static stories, no a11y/interaction tests,
not in CI) reads as worse than none. The component contracts above plus the Vitest unit specs
(variants, reflected attributes, state transitions) and the Playwright e2e specs (the real upload paths)
cover the same ground proportionally. **Where I'd reach for it:** once the primitive set grows past
~10–15 controls or is shared across apps/teams, Storybook earns its place — and then with the a11y addon,
`play`-function interaction tests, and `build-storybook` wired into CI, so it documents *and* guards
behaviour rather than just displaying it.

## Design decisions & assumptions

- **Policy numbers are stored as `string`, not `number`.** They are fixed‑width 9‑digit
  identifiers where leading zeros are significant (e.g. `000011111`), and US2's checksum is
  positional over the digit string. A JS `number` would drop leading zeros and risk
  precision issues. (Trade‑off: callers must not do arithmetic on them — which we never do.)
- **Checksum lives in its own pure service, validity is attached in the store.** `ChecksumValidator`
  is a pure `string → boolean` mod‑11 check (no I/O), unit‑testable like the parser. The store —
  the single source of truth — calls it as it maps tokens into `PolicyRecord`s, so each record
  carries a `valid` flag the table just renders (the table owns *view* state like sort/filter, not
  domain logic). A non‑9‑digit or non‑numeric token
  can't satisfy a positional checksum, so it is simply invalid. (`valid` is a `boolean` for US2's
  binary split; US4 can widen it to a `valid` / `corrected` / `AMB` / `error` union.)
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
- **CI skips `playwright install-deps`.** The `ubuntu-22.04` runner image already ships
  Chromium's shared libraries, so the e2e job drops the ~18s system‑deps step and relies on the
  image. Trade‑off: this couples CI to what GitHub bakes into the runner — adding Firefox/WebKit
  or an image slim‑down could break a browser launch, fixed by re‑adding `install-deps chromium`
  (the failure is loud and immediate, not silent).
- **`ButtonDirective` (`appButton`) over a `<app-button>` component.** A directive is
  Angular's idiomatic equivalent of React's `as` prop: the consumer applies it to the correct
  semantic element (`<button>`, `<a href>`, or — for the upload — `<label for>`) and gets
  variant/size styling, without a component re‑implementing each element's semantics. Same
  pattern as Angular Material's button. Trade‑off: its styles are global (a directive has no
  encapsulated stylesheet), which is the norm for design‑system controls.
- **Component root styling: `:host` vs. a wrapper class.** When the component's host element
  *is* the box (a single card/region that maps 1:1 to its tag — `PanelComponent`,
  `AlertComponent`), we style `:host` and put class/role/aria on `host: {}`, avoiding a
  redundant wrapper `<div>`. When the root needs to be a specific semantic or grouping element
  the host tag can't be (`<main>` in `AppComponent`, the scroll‑`<div>` + `<table>` in
  `PolicyTableComponent`), the host stays layout‑neutral and we style a class on that inner
  element. (`:host` defaults to `display: inline`, so host‑styled components must set
  `display` explicitly.)
- **A component styles only its own template — never projected content.** Under emulated view
  encapsulation, styles are scoped to the elements a component declares; content projected
  through `<ng-content>` keeps the *consumer's* encapsulation id, so a child's styles can't
  reach it. Either style projected content from the consumer's stylesheet, or make the element
  the component's own (e.g. `PanelComponent`'s subtitle is a `subtitle` input it renders and
  styles itself, not a projection slot).

## Accessibility & responsiveness

- Labelled file control that stays keyboard‑focusable (visually hidden, not removed), with a
  visible focus ring via `:focus-within`.
- Validation errors render in a `role="alert"` region and are wired to the input with
  `aria-describedby` / `aria-invalid`.
- Semantic results table with `<caption>` and scoped column headers; horizontal‑scroll guard
  for narrow screens; fluid spacing via `clamp()`.
- Colors come exclusively from the provided palette variables.

## How I approached US1

The brief asks for a file upload that accepts a CSV, validates it, and lists the policy numbers in a table. That sounds like a form, but the interesting constraint is that the file read itself is an async browser API (`File.text()`) that can fail — so there are actually three distinct failure modes: wrong type, too large, and unreadable at runtime. The design had to make all three feel the same to the user (a single inline error) while keeping the causes separately testable.

The key decision was **keeping I/O and parsing separate**. `AppComponent.onFileSelected()` owns only the async file read; `CsvParserService.parse()` is a pure function on a string. That split means the I/O path is hard to unit-test (jsdom doesn't implement `File.text()`) but trivial to cover with Playwright, while the parsing logic — where the real edge cases live — is covered exhaustively with fast synchronous unit tests. No mocking required for either.

The second consequential call was **no `[innerHTML]`**. Validation errors originally carried pre-formatted HTML strings so the component could render a `<code>` tag around the filename. That's an XSS vector — filenames are user-controlled — so errors are now a `{ filename, message }` object and the template does the markup. The store carries data, not view markup.

Everything else follows from those two: signals over RxJS (state is synchronous), `appButton` directive over a component (semantic flexibility for `<label for>`), hand-rolled CSV parser (single-column plain numbers need six lines, not a library).

---

## Future improvements

- A parse summary (counts, duplicates) after upload.
- Surface row‑level parse warnings (e.g. tokens that aren't 9 digits) ahead of US2.
- Virtualized table if exports grow to thousands of rows.
