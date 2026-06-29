import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectFieldComponent } from './select-field.component';

describe('SelectFieldComponent', () => {
  let fixture: ComponentFixture<SelectFieldComponent>;

  function render(label: string, value: string, options = [{ value: 'a', label: 'A' }]): HTMLElement {
    fixture.componentRef.setInput('label', label);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SelectFieldComponent] });
    fixture = TestBed.createComponent(SelectFieldComponent);
  });

  it('renders a label with the given text', () => {
    const el = render('Status', 'all');
    expect(el.querySelector('.select-field__label')?.textContent).toContain('Status');
  });

  it('associates the label with the select via wrapping label element', () => {
    const el = render('Status', 'all');
    const label = el.querySelector('label');
    const select = el.querySelector('select');
    expect(label).not.toBeNull();
    expect(select).not.toBeNull();
    // The select is a descendant of the label, so it is implicitly associated.
    expect(label?.contains(select)).toBe(true);
  });

  it('renders the provided options', () => {
    const el = render('Status', 'all', [
      { value: 'all', label: 'All' },
      { value: 'valid', label: 'Valid' },
    ]);
    const options = el.querySelectorAll('option');
    expect(options).toHaveLength(2);
    expect(options[0].textContent).toContain('All');
    expect(options[1].textContent).toContain('Valid');
  });

  it('emits valueChange when the select changes', () => {
    const el = render('Status', 'all', [
      { value: 'all', label: 'All' },
      { value: 'valid', label: 'Valid' },
    ]);
    const emitted: string[] = [];
    fixture.componentInstance.valueChange.subscribe((v: string) => emitted.push(v));

    const select = el.querySelector('select') as HTMLSelectElement;
    select.value = 'valid';
    select.dispatchEvent(new Event('change'));

    expect(emitted).toEqual(['valid']);
  });

  it('adds the inline class to the host when inline is true', () => {
    render('Rows', '10');
    fixture.componentRef.setInput('inline', true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList).toContain('select-field--inline');
  });

  it('does not add the inline class when inline is false', () => {
    render('Rows', '10');
    expect((fixture.nativeElement as HTMLElement).classList).not.toContain('select-field--inline');
  });
});
