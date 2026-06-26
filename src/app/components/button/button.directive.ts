import { Directive, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Styles any element as a button while letting the *consumer* choose the
 * semantic host element — Angular's idiomatic equivalent of React's `as` prop.
 *
 * Pick the right native element for the job and add `appButton`:
 *   <button appButton>Save</button>
 *   <a appButton href="…">Go</a>
 *   <label appButton for="file">Upload</label>   <!-- used by file-upload -->
 *
 * Why a directive and not a wrapping `<app-button>` component: a component owns
 * its host tag and can't *become* a `<label for>` or `<a href>` without
 * projecting content and re-implementing those elements' semantics/behaviour.
 * A directive composes onto the correct element instead. This is the same
 * approach Angular Material takes (`<button mat-button>`, `<a mat-button>`).
 *
 * Visual styling lives in a global stylesheet (`button.scss`, registered in
 * angular.json) because directives have no encapsulated styles — the standard
 * pattern for a design-system control applied across many host elements.
 *
 * The `variant`/`size` inputs are reflected to `data-*` attributes (rather than
 * modifier classes) so the stylesheet can target `[appButton][data-variant=…]`.
 * Reflecting via host bindings — instead of relying on the author's literal
 * attribute — means it works for bound usage (`[variant]="x"`) and defaults too,
 * not just static strings.
 */
@Directive({
  selector: '[appButton]',
  standalone: true,
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
  },
})
export class ButtonDirective {
  /** Visual style of the button. */
  readonly variant = input<ButtonVariant>('primary');

  /** Padding/typography scale. */
  readonly size = input<ButtonSize>('md');
}
