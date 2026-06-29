import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Shimmer-skeleton placeholder shown while policies are being processed.
 * Mirrors the real table's column layout so the transition to loaded content
 * is visually stable. Hidden from assistive tech via `aria-hidden="true"` on
 * the host — the live region in `AppComponent` announces progress instead.
 */
@Component({
  selector: 'app-policy-table-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './policy-table-skeleton.component.html',
  styleUrl: './policy-table-skeleton.component.scss',
  host: { 'aria-hidden': 'true' },
})
export class PolicyTableSkeletonComponent {
  /** Number of placeholder rows to render. */
  readonly rows = input<number>(10);

  protected readonly skeletonRows = computed(() =>
    Array.from({ length: this.rows() }),
  );
}
