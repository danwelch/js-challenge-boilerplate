import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Accessible labelled select. Renders a `<label>` + `<select>` pair with an
 * uppercase micro-label. Supports stacked (default) or side-by-side `inline`
 * layout. Emits `valueChange` on user selection; the consumer controls the
 * selected value via the `value` input.
 */
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
