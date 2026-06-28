import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { CircleCheckBig, type LucideIconData } from 'lucide-angular';
import { ChipComponent, type ChipVariant } from './chip.component';

@Component({
  standalone: true,
  imports: [ChipComponent],
  template: `<app-chip [variant]="variant" [icon]="icon">{{ label }}</app-chip>`,
})
class HostComponent {
  variant: ChipVariant = 'success';
  icon: LucideIconData | undefined = CircleCheckBig;
  label = 'Valid';
}

describe('ChipComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  function chipEl(): HTMLElement {
    return fixture.nativeElement.querySelector('app-chip');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('projects the label content', () => {
    expect(chipEl().textContent).toContain('Valid');
  });

  it('reflects the variant as a data attribute', () => {
    expect(chipEl().getAttribute('data-variant')).toBe('success');

    host.variant = 'warning';
    fixture.detectChanges();
    expect(chipEl().getAttribute('data-variant')).toBe('warning');
  });

  it('renders the leading icon when one is provided', () => {
    expect(chipEl().querySelector('svg, lucide-icon')).not.toBeNull();
  });

  it('renders no icon when none is provided', () => {
    host.icon = undefined;
    fixture.detectChanges();
    expect(chipEl().querySelector('svg, lucide-icon')).toBeNull();
  });
});
