import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { PanelComponent } from './panel.component';

@Component({
  standalone: true,
  imports: [PanelComponent],
  template: `
    <app-panel [title]="title">
      <span panel-title-extra>extra</span>
      <p panel-subtitle>subtitle</p>
      <div class="body">body</div>
    </app-panel>
  `,
})
class HostComponent {
  title = 'Upload';
}

describe('PanelComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  function panelEl(): HTMLElement {
    return fixture.nativeElement.querySelector('app-panel');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('marks the host as a labelled region landmark', () => {
    const panel = panelEl();
    expect(panel.getAttribute('role')).toBe('region');
    const titleId = panel.getAttribute('aria-labelledby')!;
    expect(titleId).toBeTruthy();
    expect(panel.querySelector('h2')?.id).toBe(titleId);
  });

  it('renders the title text', () => {
    expect(panelEl().querySelector('h2')?.textContent).toContain('Upload');
  });

  it('applies the base panel class but no variant-specific classes', () => {
    expect(panelEl().classList).toContain('panel');
    // The panel itself is variant-agnostic — consumers tag panels via
    // their own attributes/classes from the outside.
    expect(
      [...panelEl().classList].filter((c) => c.startsWith('panel--')),
    ).toEqual([]);
  });

  it('projects content into all three slots', () => {
    const panel = panelEl();
    expect(panel.querySelector('h2')?.textContent).toContain('extra');
    expect(panel.querySelector('[panel-subtitle]')?.textContent).toContain(
      'subtitle',
    );
    expect(panel.querySelector('.body')?.textContent).toContain('body');
  });

  it('gives each instance a distinct title id', () => {
    const fixtureB = TestBed.createComponent(HostComponent);
    fixtureB.detectChanges();
    const idA = panelEl().getAttribute('aria-labelledby');
    const idB = (
      fixtureB.nativeElement.querySelector('app-panel') as HTMLElement
    ).getAttribute('aria-labelledby');
    expect(idA).not.toBe(idB);
  });
});
