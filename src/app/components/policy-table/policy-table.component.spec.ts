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
      { policyNumber: '457508000', valid: true },
      { policyNumber: '123456789', valid: true },
    ]);

    const rows = el.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('457508000');
    expect(rows[1].textContent).toContain('123456789');
  });

  it('keeps duplicate policy numbers as distinct rows', () => {
    const el = render([
      { policyNumber: '861100036', valid: false },
      { policyNumber: '861100036', valid: false },
    ]);

    expect(el.querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('shows the count in the caption', () => {
    const el = render([{ policyNumber: '457508000', valid: true }]);
    expect(el.querySelector('caption')?.textContent).toContain('(1)');
  });

  it('summarises valid / invalid counts in the caption', () => {
    const el = render([
      { policyNumber: '457508000', valid: true },
      { policyNumber: '123456789', valid: true },
      { policyNumber: '457500000', valid: false },
    ]);
    expect(el.querySelector('caption')?.textContent).toContain(
      '2 valid, 1 error',
    );
  });

  it('labels each row with a status badge carrying a text alternative', () => {
    const el = render([
      { policyNumber: '457508000', valid: true },
      { policyNumber: '457500000', valid: false },
    ]);

    const rows = el.querySelectorAll('tbody tr');
    const validBadge = rows[0].querySelector('.policy-table__status-icon');
    const invalidBadge = rows[1].querySelector('.policy-table__status-icon');

    expect(validBadge?.classList).toContain('policy-table__status-icon--valid');
    expect(rows[0].querySelector('.sr-only')?.textContent).toContain('Valid');

    expect(invalidBadge?.classList).not.toContain(
      'policy-table__status-icon--valid',
    );
    expect(rows[1].querySelector('.sr-only')?.textContent).toContain('Error');
  });

  it('uses a scoped column header for accessibility', () => {
    const el = render([{ policyNumber: '457508000', valid: true }]);
    const header = el.querySelector('thead th[scope="col"]');
    expect(header).not.toBeNull();
  });
});
