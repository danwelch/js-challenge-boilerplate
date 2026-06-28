import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CircleCheckBig, LucideAngularModule, TriangleAlert } from 'lucide-angular';
import type { PolicyRecord } from '../../models/policy.model';

/**
 * Presentational table of scanned policy numbers.
 *
 * Story 1 shows the row number and policy number; US2 adds a checksum status
 * column (later stories add more, e.g. US4's correction result) without changing
 * this contract — the component simply renders whatever `PolicyRecord` fields
 * exist and derives its summary from them.
 *
 * Rows are tracked by index because the scanner can legitimately produce
 * duplicate policy numbers, so the value is not a stable key.
 */
@Component({
  selector: 'app-policy-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './policy-table.component.html',
  styleUrl: './policy-table.component.scss',
})
export class PolicyTableComponent {
  /** Policy records to display. */
  readonly policies = input.required<PolicyRecord[]>();

  /** Decorative status icons; the text label carries the meaning for a11y. */
  protected readonly validIcon = CircleCheckBig;
  protected readonly invalidIcon = TriangleAlert;

  /** Count of rows passing the checksum, derived from the input. */
  protected readonly validCount = computed(
    () => this.policies().filter((policy) => policy.valid).length,
  );

  /** Count of rows failing the checksum, derived from the input. */
  protected readonly invalidCount = computed(
    () => this.policies().length - this.validCount(),
  );
}
