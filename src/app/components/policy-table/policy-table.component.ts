import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PolicyRecord } from '../../models/policy.model';

/**
 * Presentational table of scanned policy numbers.
 *
 * Story 1 shows the row number and policy number; later stories add columns
 * (validity in US2, correction result in US4) without changing this contract —
 * the component simply renders whatever `PolicyRecord` fields exist.
 *
 * Rows are tracked by index because the scanner can legitimately produce
 * duplicate policy numbers, so the value is not a stable key.
 */
@Component({
  selector: 'app-policy-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './policy-table.component.html',
  styleUrl: './policy-table.component.scss',
})
export class PolicyTableComponent {
  /** Policy records to display. */
  readonly policies = input.required<PolicyRecord[]>();
}
