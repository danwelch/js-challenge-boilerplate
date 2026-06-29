import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ChevronLeft, ChevronRight, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
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
