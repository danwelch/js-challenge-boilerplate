# Kin OCR — project instructions

Angular 21 app. See `README.md` for setup, run/test commands, and the full list of design
decisions. This file captures conventions to follow when working in the codebase.

## What this is

A scanning machine exports a CSV of insurance policy numbers; this app uploads that CSV, parses
it, and lists the numbers in a table. Delivered story by story:

- **US1 — done:** upload a validated CSV (CSV type, ≤ 2 MB) and list the policy numbers.
- **US2 — done:** mod‑11 checksum validation (`ChecksumValidator`), valid/invalid status per row.
- **US3 — planned:** POST the processed array to a mock API, report success/failure.
- **US4 — outline only:** auto‑correct mis‑scanned digits.

## Architecture

Data flow is **one‑directional**, and each later story adds a service/signal rather than
reshaping it:

```
FileUploadComponent ──(validated File | UploadError)──▶ AppComponent
AppComponent reads file.text() ──▶ CsvParserService.parse() ──▶ PolicyStore (signals)
PolicyStore ──▶ PolicyTableComponent renders
```

- `AppComponent` is a thin orchestrator: it owns only the async file read, then delegates parsing
  to a service and state to the store. Keep the interesting logic out of it.
- `PolicyStore` (`store/policy-store.service.ts`) is the **single source of truth** — read‑only
  signals out, intent‑named actions in (`setPolicies`, `setError`, `reset`, `beginProcessing`).
  New stories extend the store, not the components.
- `CsvParserService` is a pure `string → string[]` function (no I/O), so it's unit‑testable
  without a real `File`. `ChecksumValidator` follows the same shape — a pure `string → boolean`
  mod‑11 check the store calls when mapping tokens into records, so validity is attached in the
  store (not the components) and the table stays presentational.
- Errors are structured `UploadError` objects (`{ message, filename? }`), never HTML strings —
  filenames are user‑controlled, so the template does the markup (XSS‑safe).

Key locations: `models/` (interfaces), `services/` (parser, checksum validator), `store/` (signal state),
`components/` (`alert`, `button`, `file-upload`, `panel`, `policy-table`). See the README's
*Project structure* for the full tree.

## Environment

- Node **v22** (pinned in `.nvmrc`; Angular 21 rejects odd‑numbered v25). Shells here default
  to v25 — activate the pinned version inline before build/test (`fnm use` / `nvm use`).
- `npm test` (Vitest, headless), `npm run e2e` (Playwright), `npm run lint` (Biome + angular‑eslint),
  `npm run build`. Keep all four green; `npm run lint` must be **0 warnings** (`noNonNullAssertion`
  is escalated to error).

## Component development

Components are **standalone**, **`ChangeDetectionStrategy.OnPush`**, and use the **signal APIs**
(`input()`, `input.required()`, `output()`, `signal()`, `computed()`) — not decorators
(`@Input`/`@Output`) or `NgModule`s. Keep components thin; state lives in the signal store
(`PolicyStore`), logic in services. Icons come from `lucide-angular` — never emoji. Colors and
spacing come only from the design tokens / palette CSS variables in `src/styles.scss`.

### Root styling: `:host` vs. a wrapper class

Decide by **what the root element needs to be**:

- **Use `:host`** when the component's host element (`<app-foo>`) *is* the box — a single
  card/region that maps 1:1 to its tag (e.g. `PanelComponent`, `AlertComponent`). Style `:host`
  directly and put `class` / `role` / `aria-*` / reflected `data-*` on the `host: {}` metadata.
  This avoids a redundant wrapper `<div>`.
  - Gotcha: a host element defaults to `display: inline` — host‑styled components **must** set
    `display` explicitly on `:host`. Also note `margin` on `:host` sits *outside* the component
    and affects the consumer's layout.
- **Use a class on an inner element** when the root must be a specific semantic or grouping
  element the host tag can't be — `<main>` (`AppComponent`), a scroll‑`<div>` wrapping a
  `<table>` (`PolicyTableComponent`), or a stateful wrapper (`.upload` in `FileUploadComponent`,
  which carries the `upload--processing` / `inert` state). The host stays layout‑neutral.

Rule of thumb: **host‑element‑is‑the‑box → `:host`; need a real semantic/grouping root → class
on the inner element.**

### A component styles only its own template — never projected content

Under emulated view encapsulation, a component's styles are scoped to the elements it declares
in its own template. Content projected through `<ng-content>` keeps the **consumer's**
encapsulation id, so the child component's scoped styles can never match it (the rule compiles
to `[sel][_ngcontent-CHILD]` but the projected node carries `_ngcontent-CONSUMER`).

When you need to style content that crosses the boundary, pick one:
- Style it from the **consumer's** stylesheet (where the projected element's encapsulation lives), or
- Make the element the **component's own** — take the content as an `input()` and render it in the
  component's template, then style it with a normal class. (This is why `PanelComponent`'s subtitle
  is a `subtitle` input it renders and styles itself, not a `[panel-subtitle]` projection slot.)

Avoid `::ng-deep` (deprecated) and `ViewEncapsulation.None` (leaks styles globally).

### Directive vs. component for design‑system controls

When a control must adapt to whatever semantic host element the consumer needs (`<button>`,
`<a href>`, `<label for>`), prefer a **directive** with global styles (`appButton`) over a wrapping
component — Angular's idiomatic equivalent of React's `as` prop. Use a **component** when it owns
its structure and benefits from encapsulated styles (`AlertComponent`). Select variants via a
reflected `data-*` attribute (`host: { '[attr.data-variant]': 'variant()' }`) so the stylesheet
targets `[data-variant=…]` and it works for bound usage and defaults, not just static strings.

## Testing

- Unit specs are `*.spec.ts` (Vitest, jsdom); e2e specs are `*.e2e.ts` (Playwright, real Chromium).
- jsdom doesn't implement some browser APIs (`File.text()`, the reflected `.inert` property) — cover
  those paths in e2e and assert the underlying attribute in unit tests.
- Add a test alongside any behavior change; don't introduce non‑null assertions (`!`) in specs.
