import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ChevronLeft, ChevronRight, LucideAngularModule } from 'lucide-angular';
import { ButtonDirective } from '../button/button.directive';

/**
 * Previous/next page controls. Emits `previous` / `next` and disables the
 * appropriate button at the boundary pages. Delegates button styling to
 * `appButton` (outline variant) so focus/disabled states stay consistent with
 * the rest of the design system.
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ButtonDirective],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  /** 1-based current page number. */
  readonly page = input.required<number>();
  readonly pageCount = input.required<number>();

  readonly previous = output<void>();
  readonly next = output<void>();

  protected readonly prevIcon = ChevronLeft;
  protected readonly nextIcon = ChevronRight;

  protected readonly atFirst = computed(() => this.page() <= 1);
  protected readonly atLast = computed(() => this.page() >= this.pageCount());
}
