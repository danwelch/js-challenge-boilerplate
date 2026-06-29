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
    const validBadge = rows[0].querySelector('app-policy-status .policy-status');
    const invalidBadge = rows[1].querySelector('app-policy-status .policy-status');

    expect(validBadge?.classList).toContain('policy-status--valid');
    expect(rows[0].querySelector('app-policy-status .sr-only')?.textContent).toContain('Valid');

    expect(invalidBadge?.classList).not.toContain('policy-status--valid');
    expect(rows[1].querySelector('app-policy-status .sr-only')?.textContent).toContain('Error');
  });

  it('uses a scoped column header for accessibility', () => {
    const el = render([{ policyNumber: '457508000', valid: true }]);
    const header = el.querySelector('thead th[scope="col"]');
    expect(header).not.toBeNull();
  });

  it('renders the loading skeleton instead of rows when loading', () => {
    fixture.componentRef.setInput('policies', []);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    // Skeleton component present and hidden from assistive tech via its host attribute.
    const skeleton = el.querySelector('app-policy-table-skeleton');
    expect(skeleton).not.toBeNull();
    expect(skeleton?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelectorAll('.policy-table-skeleton__bar').length).toBeGreaterThan(0);
    expect(el.querySelectorAll('tbody tr')).toHaveLength(10);
    // Controls are suppressed while loading.
    expect(el.querySelectorAll('app-select-field')).toHaveLength(0);
  });

  function numbersInOrder(el: HTMLElement): (string | undefined)[] {
    return [...el.querySelectorAll('.policy-table__number')].map((cell) =>
      cell.textContent?.trim(),
    );
  }

  it('sorts by policy number ascending then descending on header clicks', () => {
    const el = render([
      { policyNumber: '300000000', valid: true },
      { policyNumber: '100000000', valid: false },
      { policyNumber: '200000000', valid: true },
    ]);
    const numberHeader = el.querySelectorAll('thead th')[1];
    const sortBtn = numberHeader.querySelector('button') as HTMLButtonElement;

    sortBtn.click();
    fixture.detectChanges();
    expect(numbersInOrder(el)).toEqual(['100000000', '200000000', '300000000']);
    expect(numberHeader.getAttribute('aria-sort')).toBe('ascending');

    sortBtn.click();
    fixture.detectChanges();
    expect(numbersInOrder(el)).toEqual(['300000000', '200000000', '100000000']);
    expect(numberHeader.getAttribute('aria-sort')).toBe('descending');
  });

  it('restores original scan order when sorting by the # column', () => {
    const el = render([
      { policyNumber: '300000000', valid: true },
      { policyNumber: '100000000', valid: false },
    ]);
    const headers = el.querySelectorAll('thead th');

    // Re-order by number, then sort back by the index column.
    (headers[1].querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (headers[0].querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(numbersInOrder(el)).toEqual(['300000000', '100000000']);
    const indices = [...el.querySelectorAll('tbody td.policy-table__col-index')].map((cell) =>
      cell.textContent?.trim(),
    );
    expect(indices).toEqual(['1', '2']);
  });

  it('filters rows by status while keeping the caption totals', () => {
    const el = render([
      { policyNumber: '457508000', valid: true },
      { policyNumber: '457500000', valid: false },
      { policyNumber: '861100036', valid: false },
    ]);
    // First app-select-field is the status filter.
    const statusSelect = el.querySelector('app-select-field select') as HTMLSelectElement;
    statusSelect.value = 'valid';
    statusSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(el.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(numbersInOrder(el)).toEqual(['457508000']);
    // Caption still reflects the full set, not the filtered view.
    expect(el.querySelector('caption')?.textContent).toContain('1 valid, 2 errors');
  });

  it('shows an empty-filter message when no rows match the status filter', () => {
    const el = render([
      { policyNumber: '457508000', valid: true },
      { policyNumber: '123456789', valid: true },
    ]);
    const statusSelect = el.querySelector('app-select-field select') as HTMLSelectElement;
    statusSelect.value = 'invalid';
    statusSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(el.querySelector('.policy-table__empty-row')?.textContent).toContain(
      'No policy numbers match this filter.',
    );
    expect(el.querySelectorAll('.policy-table__number')).toHaveLength(0);
  });

  it('paginates, disables next at the end, and keeps # as the scan position', () => {
    const policies = Array.from({ length: 12 }, (_, i) => ({
      policyNumber: String(100000000 + i),
      valid: true,
    }));
    const el = render(policies);

    // Default page size 10 → first page shows 10 of 2 pages.
    expect(el.querySelectorAll('tbody tr')).toHaveLength(10);
    expect(el.querySelector('app-pagination .pagination__status')?.textContent).toContain('Page 1 of 2');

    const nextBtn = el.querySelectorAll('app-pagination button')[1] as HTMLButtonElement;
    nextBtn.click();
    fixture.detectChanges();

    expect(el.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(el.querySelector('app-pagination .pagination__status')?.textContent).toContain('Page 2 of 2');
    expect(nextBtn.disabled).toBe(true);
    // The # column shows the original scan positions (11, 12), not 1, 2.
    const indices = [...el.querySelectorAll('tbody td.policy-table__col-index')].map((cell) =>
      cell.textContent?.trim(),
    );
    expect(indices).toEqual(['11', '12']);
  });

  it('resets to the first page when the page size changes', () => {
    const policies = Array.from({ length: 12 }, (_, i) => ({
      policyNumber: String(100000000 + i),
      valid: true,
    }));
    const el = render(policies);

    (el.querySelectorAll('app-pagination button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('app-pagination .pagination__status')?.textContent).toContain('Page 2 of 2');

    // Second app-select-field is rows-per-page.
    const pageSizeSelect = el.querySelectorAll('app-select-field select')[1] as HTMLSelectElement;
    pageSizeSelect.value = '25';
    pageSizeSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(el.querySelectorAll('tbody tr')).toHaveLength(12);
    expect(el.querySelector('app-pagination .pagination__status')?.textContent).toContain('Page 1 of 1');
  });
});
