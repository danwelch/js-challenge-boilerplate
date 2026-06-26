import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonDirective, ButtonSize, ButtonVariant } from './button.directive';

@Component({
  standalone: true,
  imports: [ButtonDirective],
  template: `
    <button appButton [variant]="variant" [size]="size">Button</button>
    <a appButton variant="ghost" size="lg" href="#">Anchor</a>
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

  it('applies the base class plus default variant and size', () => {
    const btn = query<HTMLButtonElement>('button');
    expect(btn.classList).toContain('btn');
    expect(btn.classList).toContain('btn--primary');
    expect(btn.classList).toContain('btn--md');
  });

  it('reflects variant and size inputs reactively', () => {
    host.variant = 'secondary';
    host.size = 'sm';
    fixture.detectChanges();

    const btn = query<HTMLButtonElement>('button');
    expect(btn.classList).toContain('btn--secondary');
    expect(btn.classList).toContain('btn--sm');
    expect(btn.classList).not.toContain('btn--primary');
    expect(btn.classList).not.toContain('btn--md');
  });

  it('works on an anchor host element (as-style)', () => {
    const anchor = query<HTMLAnchorElement>('a');
    expect(anchor.classList).toContain('btn');
    expect(anchor.classList).toContain('btn--ghost');
    expect(anchor.classList).toContain('btn--lg');
  });

  it('works on a label host element (as-style)', () => {
    const label = query<HTMLLabelElement>('label');
    expect(label.classList).toContain('btn');
    expect(label.classList).toContain('btn--secondary');
    // size defaults to md when not provided
    expect(label.classList).toContain('btn--md');
  });
});
