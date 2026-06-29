import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { SortHeaderComponent } from './sort-header.component';

describe('SortHeaderComponent', () => {
  let fixture: ComponentFixture<SortHeaderComponent>;

  function render(direction: 'none' | 'asc' | 'desc' = 'none'): HTMLElement {
    fixture.componentRef.setInput('direction', direction);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SortHeaderComponent] });
    fixture = TestBed.createComponent(SortHeaderComponent);
  });

  it('renders a button', () => {
    const el = render();
    expect(el.querySelector('button')).not.toBeNull();
  });

  it('emits toggle when the button is clicked', () => {
    const el = render();
    let count = 0;
    fixture.componentInstance.toggle.subscribe(() => { count++; });
    (el.querySelector('button') as HTMLButtonElement).click();
    expect(count).toBe(1);
  });

  it('reflects the align input as a data-align attribute on the host', () => {
    fixture.componentRef.setInput('align', 'end');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).getAttribute('data-align')).toBe('end');
  });

  it('applies the active icon class when direction is asc', () => {
    const el = render('asc');
    expect(el.querySelector('.sort-header__icon--active')).not.toBeNull();
  });

  it('applies the active icon class when direction is desc', () => {
    const el = render('desc');
    expect(el.querySelector('.sort-header__icon--active')).not.toBeNull();
  });

  it('does not apply the active icon class when direction is none', () => {
    const el = render('none');
    expect(el.querySelector('.sort-header__icon--active')).toBeNull();
  });
});
