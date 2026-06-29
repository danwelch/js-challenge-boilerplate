import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Check, LucideAngularModule, X } from 'lucide-angular';

/**
 * Circular badge showing mod-11 validation result for a single policy row.
 * Renders a check (valid) or X (invalid) icon inside a coloured circle.
 * Used in the status column of `PolicyTableComponent`.
 */
@Component({
  selector: 'app-policy-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './policy-status.component.html',
  styleUrl: './policy-status.component.scss',
})
export class PolicyStatusComponent {
  readonly valid = input.required<boolean>();

  protected readonly checkIcon = Check;
  protected readonly xIcon = X;
}
