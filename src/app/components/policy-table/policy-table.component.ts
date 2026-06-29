import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import type { PolicyRecord } from '../../models/policy.model';
import { PaginationComponent } from '../pagination/pagination.component';
import { SelectFieldComponent, type SelectOption } from '../select-field/select-field.component';
import { PolicyStatusComponent } from './policy-status/policy-status.component';
import { PolicyTableSkeletonComponent } from './policy-table-skeleton/policy-table-skeleton.component';
import { SortHeaderComponent } from './sort-header/sort-header.component';

/** A policy record paired with its 1-based position in the original scan order. */
interface PolicyRow extends PolicyRecord {
  scanIndex: number;
}

type SortColumn = 'index' | 'policyNumber' | 'status';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'valid' | 'invalid';

/** Page-size choices offered in the rows-per-page control. (5 makes the 10-row
 *  sample CSV span two pages, which is handy for exercising pagination.) */
const PAGE_SIZES = [5, 10, 25, 50, 100] as const;

/** Default rows per page; also the row count for the loading skeleton. */
const DEFAULT_PAGE_SIZE = 10;

/**
 * Table of scanned policy numbers, with client-side sorting, status filtering,
 * pagination, and a loading skeleton.
 *
 * Sorting/filtering/pagination are **view** concerns, so their state lives here
 * as local signals rather than in `PolicyStore` (which stays the domain source of
 * truth). The component derives the visible page from `policies()` through a
 * filter → sort → paginate pipeline of `computed`s; the underlying records are
 * never mutated.
 *
 * Rows are tagged with a stable 1-based `scanIndex` (their position in the
 * original input) so the `#` column always traces back to the scanner output —
 * the scanner can legitimately emit duplicate policy numbers, so the displayed
 * position is not a usable identity.
 *
 * When `loading` is set the table renders a gray skeleton of its own shell (same
 * columns, no controls) instead of rows — the honest "data is coming" state used
 * while an upload is processed.
 */
@Component({
  selector: 'app-policy-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SelectFieldComponent,
    PaginationComponent,
    PolicyTableSkeletonComponent,
    SortHeaderComponent,
    PolicyStatusComponent,
  ],
  templateUrl: './policy-table.component.html',
  styleUrl: './policy-table.component.scss',
})
export class PolicyTableComponent {
  /** Policy records to display. */
  readonly policies = input.required<PolicyRecord[]>();

  /** When true, render the loading skeleton instead of the data table. */
  readonly loading = input<boolean>(false);

  protected readonly statusOptions: SelectOption[] = [
    { value: 'all', label: 'All' },
    { value: 'valid', label: 'Valid' },
    { value: 'invalid', label: 'Errors' },
  ];

  protected readonly pageSizeOptions: SelectOption[] = PAGE_SIZES.map((n) => ({
    value: String(n),
    label: String(n),
  }));

  protected readonly sortColumn = signal<SortColumn>('index');
  protected readonly sortDir = signal<SortDirection>('asc');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly pageSize = signal<number>(DEFAULT_PAGE_SIZE);
  protected readonly pageIndex = signal<number>(0);

  /** Input records tagged with their original 1-based scan position. */
  private readonly rows = computed<PolicyRow[]>(() =>
    this.policies().map((policy, index) => ({ ...policy, scanIndex: index + 1 })),
  );

  /** Count of rows passing the checksum — totals, independent of the active filter. */
  protected readonly validCount = computed(
    () => this.policies().filter((policy) => policy.valid).length,
  );

  /** Count of rows failing the checksum — totals, independent of the active filter. */
  protected readonly invalidCount = computed(
    () => this.policies().length - this.validCount(),
  );

  private readonly filtered = computed<PolicyRow[]>(() => {
    const filter = this.statusFilter();
    if (filter === 'all') {
      return this.rows();
    }
    const wantValid = filter === 'valid';
    return this.rows().filter((row) => row.valid === wantValid);
  });

  private readonly sorted = computed<PolicyRow[]>(() => {
    const column = this.sortColumn();
    const direction = this.sortDir() === 'asc' ? 1 : -1;
    // Copy before sorting so the source array (and the signals behind it) stays put.
    return [...this.filtered()].sort((a, b) => direction * this.compare(a, b, column));
  });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize())),
  );

  /**
   * Page actually shown. Clamped to the last available page so a shrinking result
   * set (a new upload, or a filter that removes rows) can never strand the view
   * on an empty page past the end.
   */
  protected readonly currentPage = computed(() =>
    Math.min(this.pageIndex(), this.pageCount() - 1),
  );

  protected readonly pagedRows = computed<PolicyRow[]>(() => {
    const start = this.currentPage() * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });

  /** Toggle sort: the active column flips direction, a new column starts ascending. */
  protected toggleSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDir.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDir.set('asc');
    }
  }

  /** `aria-sort` value for a header cell. */
  protected ariaSort(column: SortColumn): 'ascending' | 'descending' | 'none' {
    if (this.sortColumn() !== column) {
      return 'none';
    }
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  /** Direction state passed to `app-sort-header`. */
  protected sortDirection(column: SortColumn): 'none' | 'asc' | 'desc' {
    if (this.sortColumn() !== column) {
      return 'none';
    }
    return this.sortDir();
  }

  protected setStatusFilter(value: string): void {
    this.statusFilter.set(value as StatusFilter);
    this.pageIndex.set(0);
  }

  protected setPageSize(value: string): void {
    this.pageSize.set(Number(value));
    this.pageIndex.set(0);
  }

  protected goToPreviousPage(): void {
    this.pageIndex.set(Math.max(0, this.currentPage() - 1));
  }

  protected goToNextPage(): void {
    this.pageIndex.set(Math.min(this.pageCount() - 1, this.currentPage() + 1));
  }

  /** Ordering for two rows under the given column (ascending). */
  private compare(a: PolicyRow, b: PolicyRow, column: SortColumn): number {
    switch (column) {
      case 'policyNumber':
        return a.policyNumber.localeCompare(b.policyNumber);
      case 'status':
        // Errors (false) before valid (true) ascending; stable sort keeps scan order within a group.
        return Number(a.valid) - Number(b.valid);
      default:
        return a.scanIndex - b.scanIndex;
    }
  }
}
