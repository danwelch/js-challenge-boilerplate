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
 */
@Directive({
  selector: '[appButton]',
  standalone: true,
  host: {
    class: 'btn',
    '[class.btn--primary]': "variant() === 'primary'",
    '[class.btn--secondary]': "variant() === 'secondary'",
    '[class.btn--ghost]': "variant() === 'ghost'",
    '[class.btn--sm]': "size() === 'sm'",
    '[class.btn--md]': "size() === 'md'",
    '[class.btn--lg]': "size() === 'lg'",
  },
})
export class ButtonDirective {
  /** Visual style of the button. */
  readonly variant = input<ButtonVariant>('primary');

  /** Padding/typography scale. */
  readonly size = input<ButtonSize>('md');
}
