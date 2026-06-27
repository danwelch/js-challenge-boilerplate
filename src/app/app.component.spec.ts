import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { PolicyStore } from './store/policy-store.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;
  let store: PolicyStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AppComponent] });
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(PolicyStore);
    fixture.detectChanges();
  });

  it('creates the app', () => {
    expect(component).toBeTruthy();
  });

  it('renders the application title', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('OCR');
  });

  it('shows the empty state and no table before any upload', () => {
    const el = fixture.nativeElement as HTMLElement;
    const resultsPanel = el.querySelector('app-panel[data-variant="results"]')!;
    expect(resultsPanel.textContent).toContain('No policy numbers loaded yet');
    expect(el.querySelector('app-policy-table')).toBeNull();
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

  it('parses CSV text into the store', () => {
    component.loadFromText('457508000,123456789', 'policies.csv');
    fixture.detectChanges();

    expect(store.policies()).toEqual([
      { policyNumber: '457508000' },
      { policyNumber: '123456789' },
    ]);
  });

  it('reports an error when the CSV has no policy numbers', () => {
    component.loadFromText('  , \n ', 'empty.csv');

    expect(store.uploadError()).toContain('did not contain any policy numbers');
    expect(store.hasPolicies()).toBe(false);
  });
});
