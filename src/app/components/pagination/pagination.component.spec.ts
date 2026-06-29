import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let fixture: ComponentFixture<PaginationComponent>;

  function render(page: number, pageCount: number): HTMLElement {
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('pageCount', pageCount);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PaginationComponent] });
    fixture = TestBed.createComponent(PaginationComponent);
  });

  it('shows the current page and total', () => {
    const el = render(2, 5);
    expect(el.querySelector('.pagination__status')?.textContent).toContain('Page 2 of 5');
  });

  it('has aria-live="polite" on the status span', () => {
    const el = render(1, 1);
    expect(el.querySelector('.pagination__status')?.getAttribute('aria-live')).toBe('polite');
  });

  it('disables the previous button on page 1', () => {
    const el = render(1, 3);
    const [prev] = el.querySelectorAll<HTMLButtonElement>('button');
    expect(prev.disabled).toBe(true);
  });

  it('enables the previous button on page 2+', () => {
    const el = render(2, 3);
    const [prev] = el.querySelectorAll<HTMLButtonElement>('button');
    expect(prev.disabled).toBe(false);
  });

  it('disables the next button on the last page', () => {
    const el = render(3, 3);
    const buttons = el.querySelectorAll<HTMLButtonElement>('button');
    expect(buttons[1].disabled).toBe(true);
  });

  it('enables the next button when not on the last page', () => {
    const el = render(2, 3);
    const buttons = el.querySelectorAll<HTMLButtonElement>('button');
    expect(buttons[1].disabled).toBe(false);
  });

  it('emits previous when the previous button is clicked', () => {
    const el = render(2, 3);
    let count = 0;
    fixture.componentInstance.previous.subscribe(() => { count++; });
    (el.querySelectorAll('button')[0] as HTMLButtonElement).click();
    expect(count).toBe(1);
  });

  it('emits next when the next button is clicked', () => {
    const el = render(2, 3);
    let count = 0;
    fixture.componentInstance.next.subscribe(() => { count++; });
    (el.querySelectorAll('button')[1] as HTMLButtonElement).click();
    expect(count).toBe(1);
  });

  it('labels the buttons for assistive tech', () => {
    const el = render(2, 3);
    const [prev, next] = el.querySelectorAll<HTMLButtonElement>('button');
    expect(prev.getAttribute('aria-label')).toBe('Previous page');
    expect(next.getAttribute('aria-label')).toBe('Next page');
  });
});
