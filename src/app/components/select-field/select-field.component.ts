import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './select-field.component.html',
  styleUrl: './select-field.component.scss',
  host: { '[class.select-field--inline]': 'inline()' },
})
export class SelectFieldComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly options = input<SelectOption[]>([]);
  /** Stack label above the select (false) or place them side-by-side (true). */
  readonly inline = input<boolean>(false);

  readonly valueChange = output<string>();

  protected onChange(event: Event): void {
    this.valueChange.emit((event.target as HTMLSelectElement).value);
  }
}
