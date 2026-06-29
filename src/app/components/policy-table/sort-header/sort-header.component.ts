import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ArrowDown, ArrowUp, ChevronsUpDown, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-sort-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './sort-header.component.html',
  styleUrl: './sort-header.component.scss',
  host: {
    '[attr.data-align]': 'align()',
  },
})
export class SortHeaderComponent {
  readonly direction = input<'none' | 'asc' | 'desc'>('none');
  readonly align = input<'start' | 'end' | 'center'>('start');

  readonly toggle = output<void>();

  protected readonly icon = computed(() => {
    if (this.direction() === 'asc') return ArrowUp;
    if (this.direction() === 'desc') return ArrowDown;
    return ChevronsUpDown;
  });
}
