import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule, type LucideIconData } from 'lucide-angular';

/** Status colour a chip renders in; each maps to a palette token in the SCSS. */
export type ChipVariant = 'success' | 'warning';

/**
 * Small, solid status pill: a status-coloured background and border, white text,
 * and an optional leading icon.
 *
 * A component (not a directive like `appButton`) because the chip owns its
 * structure — a leading icon plus its label — and benefits from encapsulated
 * styles, the same reasoning as `AlertComponent`. The host element *is* the pill,
 * so it's styled via `:host`; the variant is selected by a reflected
 * `data-variant` attribute so the stylesheet targets `[data-variant=…]` and it
 * works for bound usage and defaults alike.
 *
 * The label is projected; the icon is the component's own (passed as a
 * `LucideIconData`) so the consumer chooses which glyph to show.
 *
 * Usage: `<app-chip variant="success" [icon]="checkIcon">Valid</app-chip>`
 */
@Component({
  selector: 'app-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.scss',
  host: {
    '[attr.data-variant]': 'variant()',
  },
})
export class ChipComponent {
  /** Status colour of the chip. */
  readonly variant = input.required<ChipVariant>();

  /** Optional leading icon (a lucide icon). Decorative — the label carries meaning. */
  readonly icon = input<LucideIconData>();
}
