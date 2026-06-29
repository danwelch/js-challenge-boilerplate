# Decompose PolicyTableComponent into subcomponents (restore 4kb style budget)

## Context

`PolicyTableComponent` grew to ~300 lines of SCSS when it absorbed sort, status
filter, pagination, and a loading skeleton. Its compiled stylesheet exceeds the
Angular default per-component budget (`anyComponentStyle` 4kb error), so the error
cap was temporarily raised to **5kb** (`angular.json`). The default 2kb/4kb block
came from the original boilerplate (commit `3b9b15d`), not a deliberate decision —
but we want to honour it rather than keep inflating it.

**Goal:** split the component into focused subcomponents so each stylesheet is
small, then restore the budget to **2kb warning / 4kb error**. This is a **pure
refactor** — the UI must look and behave identically (verify no visual/behaviour
change). Under Angular's emulated encapsulation, a component's scoped CSS only
matches elements in *its own* template, so **markup must move together with the
CSS it needs** — that's why each extraction takes both.

**Decisions (already made — do not re-litigate):**
- **Lean set:** extract Skeleton, Pagination, SelectField, SortHeader, StatusBadge.
  Do **not** extract a row component (a `tr[attr]` component adds table-semantics
  complexity but moves almost no CSS — column widths and row striping must stay on
  the parent table). Keep the title/count in the parent header.
- **Layout:** table-specific children nested under `components/policy-table/`;
  genuinely reusable ones at `components/` top level.
- Keep all conventions: standalone, `ChangeDetectionStrategy.OnPush`, signal APIs
  (`input()`/`output()`/`computed()`), no `!` non-null assertions, lint 0 warnings.

## New components

### Reusable — `src/app/components/`

**`SelectFieldComponent` (`app-select-field`)** — labelled `<select>`, used for both
the status filter and rows-per-page.
- Inputs: `label` (required), `value` (required), `options: { value: string; label: string }[]`, `inline` (boolean, default false).
- Output: `valueChange: string` (emit the inner `<select>`'s value on `change`).
- Absorbs the current `.policy-table__control`, `__control-label`, `__control--inline`,
  `.policy-table__select` (+ its `:focus-visible`) rules, renamed `.select-field*`.
- `:host { display: inline-block }` so the parent can position it. The wrapping
  `<label>` associates the text for AT; the native `<select>` stays the control.

**`PaginationComponent` (`app-pagination`)** — prev/next + "Page X of Y".
- Inputs: `page` (1-based current), `pageCount`.
- Outputs: `previous`, `next` (void) — parent keeps its existing clamping in
  `goToPreviousPage`/`goToNextPage`.
- Disabled state derived internally (`page <= 1`, `page >= pageCount`). Keep
  `aria-live="polite"` on the status span and `aria-label` on the icon buttons.
- Absorbs `.policy-table__pagination`, `__page-status`, `__page-btn`
  (+ hover/disabled/focus-visible), renamed `.pagination*`. Owns `ChevronLeft/Right`.

### Table-specific (nested) — `src/app/components/policy-table/`

**`PolicyTableSkeletonComponent` (`app-policy-table-skeleton`)** — `policy-table/policy-table-skeleton/`
- Input: `rows` (number, default 10).
- Renders the header skeleton bar + table shell (3 cols) + N skeleton rows; root
  `aria-hidden="true"` (e.g. via `host: { 'aria-hidden': 'true' }`).
- Absorbs all skeleton CSS (`__skeleton-bar*`, `__skeleton-circle`, the
  `@keyframes` and `prefers-reduced-motion` block), renamed `.table-skeleton*`.
- **Restates** the small table-shell rules it needs to mirror columns (table width
  / `border-collapse`, th/td padding, the teal `thead th`, `col-index`/`col-status`
  `width:1px`). This is a deliberate ~15-line duplication — the only encapsulation-
  clean way to keep the skeleton visually identical. (Parent keeps the `[loading]`
  input and renders `<app-policy-table-skeleton>` when loading, so the public API is
  unchanged.)

**`SortHeaderComponent` (`app-sort-header`)** — `policy-table/sort-header/`
- Content-projects the label (`<ng-content>`). Inputs: `direction: 'none' | 'asc' | 'desc'`, `align: 'start' | 'end' | 'center'` (default `'start'`). Output: `toggle` (void).
- Renders the `<button>` + the direction icon (`ArrowUp`/`ArrowDown`/`ChevronsUpDown`,
  full opacity only when active). `color/font: inherit` still picks up the teal `<th>`
  via normal CSS inheritance. Reflect `align` to a host `data-align` attribute and
  drive the button's `justify-content` from it (`:host([data-align="end"]) .sort-header__btn { … }`).
- Absorbs `.policy-table__sort*` (button fills cell, focus ring, icon opacity, the
  `col-index`/`col-status` alignment) → `.sort-header*`.
- The parent `<th>` keeps `scope` + `[attr.aria-sort]` (computed by the parent and
  passed to the child as `direction`).

**`StatusBadgeComponent` (`app-policy-status`)** — `policy-table/policy-status/`
- Input: `valid` (boolean). Renders the coloured circle + `Check`/`X` (`aria-hidden`)
  and the `sr-only` "Valid"/"Error" text (`.sr-only` is global in `styles.scss`).
- Absorbs `.policy-table__status-icon(+--valid)` → `.policy-status(+--valid)`. Owns
  `Check`/`X` icons.

## Parent `PolicyTableComponent` after refactor
- **Keep:** all view-state signals + the filter→sort→paginate `computed` pipeline,
  `toggleSort`, `ariaSort`, `validCount`/`invalidCount`, `setStatusFilter`/`setPageSize`/
  page handlers, `PolicyRow`/types/`PAGE_SIZES`/`DEFAULT_PAGE_SIZE`.
- **Remove:** `sortIcon()` and the icon fields (`ArrowUp`/`Check`/`ChevronLeft`/… —
  they move to children), and `LucideAngularModule` from imports (parent no longer
  renders icons directly).
- **Add:** `statusOptions` and `pageSizeOptions` arrays (`{value,label}[]`) for the
  two `app-select-field`s; a small helper to map a column to `'none'|'asc'|'desc'`
  for the sort header's `direction`; import the 5 new components.
- **Template:** header keeps the title/summary; status filter → `<app-select-field>`;
  thead cell → `<th ... [attr.aria-sort]="ariaSort('x')"><app-sort-header [direction]="sortDirection('x')" align="…" (toggle)="toggleSort('x')">Label</app-sort-header></th>`;
  status cell → `<app-policy-status [valid]="row.valid" />`; footer → rows-per-page
  `<app-select-field>` + `<app-pagination [page]="currentPage()+1" [pageCount]="pageCount()" (previous)="goToPreviousPage()" (next)="goToNextPage()" />`; loading → `<app-policy-table-skeleton [rows]="…" />`. Both select-fields are `[inline]="true"` (matches current).
- **SCSS (parent keeps only):** `.policy-table__scroll`, `.policy-table`, th/td +
  teal `thead th` + striping/hover, `__col-index`/`__col-status` widths, `__number`,
  header layout (`__header`/`__heading`/`__title`/`__summary` + `app-select-field { align-self:end }` in the header),
  `__footer`, `__empty-row`. Everything else moves out. This drops the parent well
  under 4kb.

## angular.json
Restore the budget: `anyComponentStyle` → `maximumWarning: "2kb"`, `maximumError: "4kb"`.

## Tests

Each new component gets a `*.spec.ts` (Vitest/jsdom): rendering + input/output +
a11y specifics — SelectField (label assoc, emits on change), Pagination
(disabled at bounds, emits prev/next, `aria-live` status text), Skeleton
(`rows` count, root `aria-hidden`), SortHeader (icon per `direction`, emits
`toggle`, `align` → `data-align`), StatusBadge (`--valid` class + `sr-only` text per `valid`).

Update existing specs/e2e by **remapping moved selectors** (behaviour unchanged):

| Was (parent class) | Now |
| --- | --- |
| `.policy-table__select` | `app-select-field select` (1st = status, 2nd = rows-per-page) |
| `.policy-table__page-status` / `__page-btn` | `app-pagination .pagination__status` / `app-pagination button` |
| `.policy-table__skeleton-bar` | `app-policy-table-skeleton` present (+ `.table-skeleton__bar`) |
| `thead th button` (sort) | `th app-sort-header button` (aria-sort stays on `th`) |
| `.policy-table__status-icon` / row `.sr-only` | `app-policy-status` (`.policy-status--valid`, `.sr-only`) |

Unchanged hooks: `caption`, `.policy-table__number`, `.policy-table__empty-row`,
`tbody tr`, sort headers reachable via `getByRole('button', { name: /…/ })`,
and the app-level `[role="status"][aria-live="polite"]`. Files to update:
`policy-table.component.spec.ts`, `app.component.spec.ts` (skeleton + "no selects
while loading" → `app-select-field` count 0), `e2e/upload.e2e.ts`.

Docs: refresh the `app-policy-table` section in `README.md` (note the subcomponents
+ that view state stays in the parent) and the `CLAUDE.md` component list.

## Verification (all must pass)
1. `fnm use` (Node v22 — the shell defaults to v25, which Angular 21 rejects).
2. `npm test` — all specs green (existing + 5 new).
3. `npm run lint` — **0 warnings**.
4. `npm run build` — **no 4kb errors** (2kb soft warnings are acceptable; confirm
   each new component and the parent are under the 4kb error cap).
5. `npm run e2e` — 10 passing.
6. If a dev server / preview is available: confirm idle empty state, processing
   skeleton, and the loaded table (sort/filter/paginate) are **visually and
   behaviourally identical** to before — this is a refactor, not a redesign.

## Notes
- Do **not** commit or push — leave changes in the working tree for human review.
- Single sequential pass (the parent template/spec touch every child) — do not
  parallelize across multiple agents.
- Do **not** raise the style budget; the whole point is to get back under 4kb. If a
  component still exceeds it, trim/consolidate and flag it.
