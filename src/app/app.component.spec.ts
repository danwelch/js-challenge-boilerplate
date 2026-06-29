import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { AppComponent, MIN_PROCESSING_MS } from './app.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { PolicyStore } from './store/policy-store.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;
  let store: PolicyStore;

  /** Build the fixture with an overridable processing floor (0 by default → no wait). */
  function setup(minMs = 0): void {
    // Allow a test to rebuild the fixture with a different floor after the
    // outer beforeEach has already configured one.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: MIN_PROCESSING_MS, useValue: minMs }],
    });
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(PolicyStore);
    fixture.detectChanges();
  }

  beforeEach(() => setup());

  it('creates the app', () => {
    expect(component).toBeTruthy();
  });

  it('renders the application title', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('OCR');
  });

  it('shows an honest empty state (no preview table) before any upload', () => {
    const el = fixture.nativeElement as HTMLElement;
    const empty = el.querySelector('.results-empty');
    expect(empty).not.toBeNull();
    expect(
      empty?.querySelector('.results-empty__title')?.textContent,
    ).toContain('No policy numbers yet');
    // No fake/blurred table behind the prompt — the table only renders for real
    // data or the processing skeleton.
    expect(el.querySelector('app-policy-table')).toBeNull();
  });

  it('renders the table with its loading skeleton while processing', () => {
    store.beginProcessing();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-policy-table')).not.toBeNull();
    expect(el.querySelector('.results-empty')).toBeNull();
    // Skeleton, not the real controls/rows.
    expect(el.querySelectorAll('.policy-table__skeleton-bar').length).toBeGreaterThan(0);
    expect(el.querySelectorAll('.policy-table__select')).toHaveLength(0);
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Processing');
  });

  it('renders the table once policies are loaded', () => {
    store.setPolicies(['457508000', '123456789'], 'policies.csv');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-policy-table')).not.toBeNull();
    expect(el.querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('shows the current file in the upload panel when one is loaded', () => {
    store.setPolicies(['457508000'], 'policies.csv');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.upload__current')?.textContent).toContain(
      'policies.csv',
    );
    expect(el.querySelector('.upload__dropzone')).toBeNull();
  });

  it('flips processing on, holds for the minimum processing time, then loads the file', async () => {
    setup(1000);
    vi.useFakeTimers();

    // Stub File.text() — jsdom doesn't implement it.
    const file = new File(['457508000,123456789'], 'sample.csv', {
      type: 'text/csv',
    });
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve('457508000,123456789'),
    });

    try {
      const pending = component.onFileSelected(file);

      // Immediately after kickoff: processing is on, store has no policies yet.
      await Promise.resolve();
      expect(store.processing()).toBe(true);
      expect(store.hasPolicies()).toBe(false);

      // Fast-forward past the floor and let the resulting microtasks settle.
      await vi.advanceTimersByTimeAsync(1000);
      await pending;

      expect(store.processing()).toBe(false);
      expect(store.hasPolicies()).toBe(true);
      expect(store.sourceName()).toBe('sample.csv');
    } finally {
      vi.useRealTimers();
    }
  });

  it('skips the wait entirely when the floor is zero', async () => {
    // The default setup() already provides MIN_PROCESSING_MS = 0.
    const file = new File(['457508000'], 'sample.csv', { type: 'text/csv' });
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve('457508000'),
    });

    await component.onFileSelected(file);

    expect(store.processing()).toBe(false);
    expect(store.hasPolicies()).toBe(true);
  });

  it('records an error when the file cannot be read', async () => {
    const file = new File([''], 'unreadable.csv', { type: 'text/csv' });
    Object.defineProperty(file, 'text', {
      value: () => Promise.reject(new Error('boom')),
    });

    await component.onFileSelected(file);

    expect(store.uploadError()).toEqual({
      filename: 'unreadable.csv',
      message: 'could not be read. Please try again.',
    });
    expect(store.processing()).toBe(false);
    expect(store.hasPolicies()).toBe(false);
  });

  it('reset from the upload control clears the store and re-expands', () => {
    store.setPolicies(['457508000'], 'policies.csv');
    fixture.detectChanges();

    const resetBtn = fixture.nativeElement.querySelector(
      '.upload__actions button[appButton]',
    ) as HTMLButtonElement;
    resetBtn.click();
    fixture.detectChanges();

    expect(store.sourceName()).toBeNull();
    expect(store.hasPolicies()).toBe(false);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.upload__dropzone'),
    ).not.toBeNull();
  });

  it('live region is present and empty at idle, announces processing, then loaded count', () => {
    const el = fixture.nativeElement as HTMLElement;
    const region = el.querySelector('[role="status"][aria-live="polite"]');
    expect(region).not.toBeNull();
    expect(region?.textContent?.trim()).toBe('');

    store.beginProcessing();
    fixture.detectChanges();
    expect(region?.textContent).toContain('Processing upload');

    store.setPolicies(['457508000', '457500000'], 'f.csv');
    fixture.detectChanges();
    expect(region?.textContent).toContain('Loaded');
    expect(region?.textContent).toContain('2 policy numbers');
  });

  it('parses CSV text into the store', () => {
    component.loadFromText('457508000,123456789', 'policies.csv');
    fixture.detectChanges();

    expect(store.policies()).toEqual([
      { policyNumber: '457508000', valid: true },
      { policyNumber: '123456789', valid: true },
    ]);
  });

  it('reports an error when the CSV has no policy numbers', () => {
    component.loadFromText('  , \n ', 'empty.csv');

    expect(store.uploadError()).toEqual({
      filename: 'empty.csv',
      message: 'did not contain any policy numbers.',
    });
    expect(store.hasPolicies()).toBe(false);
  });

  it("wires the upload control's validationError into the store", () => {
    const uploadCmp = fixture.debugElement.query(
      By.directive(FileUploadComponent),
    ).componentInstance as FileUploadComponent;

    uploadCmp.validationError.emit({
      filename: 'notes.txt',
      message: 'is not a CSV file.',
    });
    fixture.detectChanges();

    expect(store.uploadError()).toEqual({
      filename: 'notes.txt',
      message: 'is not a CSV file.',
    });
  });
});
