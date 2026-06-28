import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  CircleCheckBig,
  LucideAngularModule,
  OctagonAlert,
  TriangleAlert,
} from 'lucide-angular';

export type AlertVariant = 'success' | 'warning' | 'error';

/** Icon shown for each variant. */
const VARIANT_ICONS: Record<AlertVariant, typeof OctagonAlert> = {
  success: CircleCheckBig,
  warning: TriangleAlert,
  error: OctagonAlert,
};

/** Label shown for each variant. */
const VARIANT_LABELS: Record<AlertVariant, string> = {
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
};

/**
 * Inline status message with `success` / `warning` / `error` variants.
 *
 * A component (rather than a directive like `appButton`) fits here because the
 * alert owns its structure — a variant icon plus projected message text — and
 * benefits from encapsulated styles. Variant theming is selected by a reflected
 * `data-variant` attribute, mirroring the button's approach.
 *
 * Accessibility: errors announce assertively (`role="alert"`); success and
 * warning use a polite live region (`role="status"`). The icon is decorative.
 *
 * Usage: `<app-alert variant="error">Something went wrong</app-alert>`
 */
@Component({
  selector: 'app-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss',
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.role]': 'role()',
    '[attr.aria-live]': 'ariaLive()',
  },
})
export class AlertComponent {
  /** Visual and semantic style of the alert. */
  readonly variant = input.required<AlertVariant>();

  protected readonly icon = computed(() => VARIANT_ICONS[this.variant()]);
  protected readonly label = computed(() => VARIANT_LABELS[this.variant()]);

  protected readonly role = computed(() =>
    this.variant() === 'error' ? 'alert' : 'status',
  );

  protected readonly ariaLive = computed(() =>
    this.variant() === 'error' ? 'assertive' : 'polite',
  );
}
