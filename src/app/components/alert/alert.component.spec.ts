import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertComponent, type AlertVariant } from './alert.component';

@Component({
  standalone: true,
  imports: [AlertComponent],
  template: `<app-alert [variant]="variant">{{ message }}</app-alert>`,
})
class HostComponent {
  variant: AlertVariant = 'error';
  message = 'Something happened';
}

describe('AlertComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  function alertEl(): HTMLElement {
    return fixture.nativeElement.querySelector('app-alert');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('projects the message content', () => {
    expect(alertEl().textContent).toContain('Something happened');
  });

  it('reflects the variant as a data attribute', () => {
    expect(alertEl().getAttribute('data-variant')).toBe('error');

    host.variant = 'success';
    fixture.detectChanges();
    expect(alertEl().getAttribute('data-variant')).toBe('success');
  });

  it('announces errors assertively via role="alert"', () => {
    expect(alertEl().getAttribute('role')).toBe('alert');
    expect(alertEl().getAttribute('aria-live')).toBe('assertive');
  });

  it('uses a polite status region for success and warning', () => {
    for (const variant of ['success', 'warning'] as AlertVariant[]) {
      host.variant = variant;
      fixture.detectChanges();
      expect(alertEl().getAttribute('role')).toBe('status');
      expect(alertEl().getAttribute('aria-live')).toBe('polite');
    }
  });

  it('renders a variant icon', () => {
    expect(alertEl().querySelector('svg, lucide-icon')).not.toBeNull();
  });
});
