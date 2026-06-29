import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { PolicyTableSkeletonComponent } from './policy-table-skeleton.component';

describe('PolicyTableSkeletonComponent', () => {
  let fixture: ComponentFixture<PolicyTableSkeletonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PolicyTableSkeletonComponent] });
    fixture = TestBed.createComponent(PolicyTableSkeletonComponent);
  });

  it('renders 10 skeleton rows by default', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('tbody tr')).toHaveLength(10);
  });

  it('renders the requested number of rows via the rows input', () => {
    fixture.componentRef.setInput('rows', 5);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('tbody tr')).toHaveLength(5);
  });

  it('hides the skeleton from assistive tech via aria-hidden on the host', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the title shimmer bar', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.policy-table-skeleton__bar--title')).not.toBeNull();
  });
});
