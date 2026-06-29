import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

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
