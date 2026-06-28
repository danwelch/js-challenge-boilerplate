import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ButtonDirective,
  type ButtonSize,
  type ButtonVariant,
} from './button.directive';

@Component({
  standalone: true,
  imports: [ButtonDirective],
  template: `
    <button appButton [variant]="variant" [size]="size">Button</button>
    <a appButton variant="primary" size="lg" href="#">Anchor</a>
    <label appButton variant="secondary">Label</label>
  `,
})
class HostComponent {
  variant: ButtonVariant = 'primary';
  size: ButtonSize = 'md';
}

describe('ButtonDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  function query<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector) as T;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('reflects default variant and size as data attributes', () => {
    const btn = query<HTMLButtonElement>('button');
    expect(btn.hasAttribute('appButton')).toBe(true);
    expect(btn.getAttribute('data-variant')).toBe('primary');
    expect(btn.getAttribute('data-size')).toBe('md');
  });

  it('updates the data attributes when inputs change', () => {
    host.variant = 'secondary';
    host.size = 'sm';
    fixture.detectChanges();

    const btn = query<HTMLButtonElement>('button');
    expect(btn.getAttribute('data-variant')).toBe('secondary');
    expect(btn.getAttribute('data-size')).toBe('sm');
  });

  it('works on an anchor host element (as-style)', () => {
    const anchor = query<HTMLAnchorElement>('a');
    expect(anchor.hasAttribute('appButton')).toBe(true);
    expect(anchor.getAttribute('data-variant')).toBe('primary');
    expect(anchor.getAttribute('data-size')).toBe('lg');
  });

  it('works on a label host element (as-style)', () => {
    const label = query<HTMLLabelElement>('label');
    expect(label.hasAttribute('appButton')).toBe(true);
    expect(label.getAttribute('data-variant')).toBe('secondary');
    // size defaults to md when not provided
    expect(label.getAttribute('data-size')).toBe('md');
  });
});
