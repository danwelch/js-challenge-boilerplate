import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Monotonic counter so each panel gets a unique title id without DI plumbing. */
let panelIdCounter = 0;

/**
 * Section-style card with a labelled heading and projected body.
 *
 * The host renders as a labelled landmark (`role="region"` + `aria-labelledby`)
 * so each panel shows up in assistive-tech navigation. The panel itself is
 * deliberately variant-agnostic: rather than enumerate a fixed list of variants
 * here, consumers tag individual panels with whatever HTML attribute makes
 * sense for their context (e.g. `<app-panel data-variant="results">`) and
 * target them from their own stylesheet — `app-panel[data-variant="results"]`.
 * This keeps the panel a clean structural primitive.
 *
 * Three projection slots:
 *   - `[panel-title-extra]`: inline content rendered next to the title text
 *     (e.g. a trailing label beside the title).
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
    class: 'panel',
    role: 'region',
    '[attr.aria-labelledby]': 'titleId',
  },
})
export class PanelComponent {
  /** Panel title text. Required so the labelled-region landmark is meaningful. */
  readonly title = input.required<string>();

  /** Unique id wired up to `aria-labelledby` and the `<h2>` title element. */
  protected readonly titleId = `app-panel-title-${++panelIdCounter}`;
}
