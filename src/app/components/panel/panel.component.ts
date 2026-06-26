import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type PanelVariant = 'upload' | 'results';

/** Monotonic counter so each panel gets a unique title id without DI plumbing. */
let panelIdCounter = 0;

/**
 * Section-style card with a labelled heading and projected body. Replaces the
 * ad-hoc `.app__panel` markup that used to live inline in `AppComponent`.
 *
 * The host renders as a labelled landmark (`role="region"` + `aria-labelledby`)
 * so each panel shows up in assistive-tech navigation. The visual style is
 * picked by a `variant` input that maps to a BEM-style modifier class
 * (`app__panel--upload`, `app__panel--results`, …) — the consumer keeps using
 * the existing class names and can target them in `app.component.scss`.
 *
 * Three projection slots:
 *   - `[panel-title-extra]`: inline content rendered next to the title text
 *     (e.g. the "for filename.csv" trailing label on the results panel).
 *   - `[panel-subtitle]`: the subtitle block under the title.
 *   - default: panel body content.
 */
@Component({
  selector: 'app-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.scss',
  host: {
    class: 'app__panel',
    role: 'region',
    '[class.app__panel--upload]': "variant() === 'upload'",
    '[class.app__panel--results]': "variant() === 'results'",
    '[attr.aria-labelledby]': 'titleId',
  },
})
export class PanelComponent {
  /** Visual style; reflected as a BEM modifier class on the host. */
  readonly variant = input.required<PanelVariant>();

  /** Panel title text. Required so the labelled-region landmark is meaningful. */
  readonly title = input.required<string>();

  /** Unique id wired up to `aria-labelledby` and the `<h2>` title element. */
  protected readonly titleId = `app-panel-title-${++panelIdCounter}`;
}
