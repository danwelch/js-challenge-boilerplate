import { type ComponentFixture, TestBed } from '@angular/core/testing';
import type { PolicyRecord } from '../../models/policy.model';
import { PolicyTableComponent } from './policy-table.component';

describe('PolicyTableComponent', () => {
  let fixture: ComponentFixture<PolicyTableComponent>;

  function render(policies: PolicyRecord[]): HTMLElement {
    fixture.componentRef.setInput('policies', policies);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PolicyTableComponent] });
    fixture = TestBed.createComponent(PolicyTableComponent);
  });

  it('renders one row per policy with its number', () => {
    const el = render([
      { policyNumber: '457508000' },
      { policyNumber: '123456789' },
    ]);

    const rows = el.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('457508000');
    expect(rows[1].textContent).toContain('123456789');
  });

  it('keeps duplicate policy numbers as distinct rows', () => {
    const el = render([
      { policyNumber: '861100036' },
      { policyNumber: '861100036' },
    ]);

    expect(el.querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('shows the count in the caption', () => {
    const el = render([{ policyNumber: '457508000' }]);
    expect(el.querySelector('caption')?.textContent).toContain('(1)');
  });

  it('uses a scoped column header for accessibility', () => {
    const el = render([{ policyNumber: '457508000' }]);
    const header = el.querySelector('thead th[scope="col"]');
    expect(header).not.toBeNull();
  });
});
