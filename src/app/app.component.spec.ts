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
    const resultsPanel = el.querySelector('app-panel.app__panel--results')!;
    expect(resultsPanel.textContent).toContain('No policy numbers loaded yet');
    expect(el.querySelector('app-policy-table')).toBeNull();
  });

  it('renders the table once policies are loaded', () => {
    store.setPolicies(['457508000', '123456789'], 'policies.csv');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-policy-table')).not.toBeNull();
    expect(el.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(el.querySelector('.app__panel-title-count')?.textContent).toContain(
      'policies.csv',
    );
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
