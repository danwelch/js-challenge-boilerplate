import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { PolicyStatusComponent } from './policy-status.component';

describe('PolicyStatusComponent', () => {
  let fixture: ComponentFixture<PolicyStatusComponent>;

  function render(valid: boolean): HTMLElement {
    fixture.componentRef.setInput('valid', valid);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PolicyStatusComponent] });
    fixture = TestBed.createComponent(PolicyStatusComponent);
  });

  it('adds the --valid modifier class when valid is true', () => {
    const el = render(true);
    expect(el.querySelector('.policy-status--valid')).not.toBeNull();
  });

  it('does not add the --valid modifier class when valid is false', () => {
    const el = render(false);
    expect(el.querySelector('.policy-status--valid')).toBeNull();
  });

  it('shows "Valid" sr-only text when valid is true', () => {
    const el = render(true);
    expect(el.querySelector('.sr-only')?.textContent).toContain('Valid');
  });

  it('shows "Error" sr-only text when valid is false', () => {
    const el = render(false);
    expect(el.querySelector('.sr-only')?.textContent).toContain('Error');
  });

  it('hides the badge icon from assistive tech', () => {
    const el = render(true);
    expect(el.querySelector('.policy-status')?.getAttribute('aria-hidden')).toBe('true');
  });
});
