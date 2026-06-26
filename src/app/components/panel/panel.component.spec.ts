import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PanelComponent, PanelVariant } from './panel.component';

@Component({
  standalone: true,
  imports: [PanelComponent],
  template: `
    <app-panel [variant]="variant" [title]="title">
      <span panel-title-extra>extra</span>
      <p panel-subtitle>subtitle</p>
      <div class="body">body</div>
    </app-panel>
  `,
})
class HostComponent {
  variant: PanelVariant = 'upload';
  title = 'Upload';
}

describe('PanelComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  function panelEl(): HTMLElement {
    return fixture.nativeElement.querySelector('app-panel');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('marks the host as a labelled region landmark', () => {
    const panel = panelEl();
    expect(panel.getAttribute('role')).toBe('region');
    const titleId = panel.getAttribute('aria-labelledby')!;
    expect(titleId).toBeTruthy();
    expect(panel.querySelector('h2')!.id).toBe(titleId);
  });

  it('renders the title text', () => {
    expect(panelEl().querySelector('h2')!.textContent).toContain('Upload');
  });

  it('applies the BEM modifier class for the current variant', () => {
    expect(panelEl().classList).toContain('panel');
    expect(panelEl().classList).toContain('panel--upload');
    expect(panelEl().classList).not.toContain('panel--results');

    host.variant = 'results';
    fixture.detectChanges();

    expect(panelEl().classList).toContain('panel--results');
    expect(panelEl().classList).not.toContain('panel--upload');
  });

  it('projects content into all three slots', () => {
    const panel = panelEl();
    expect(panel.querySelector('h2')!.textContent).toContain('extra');
    expect(panel.querySelector('[panel-subtitle]')!.textContent).toContain('subtitle');
    expect(panel.querySelector('.body')!.textContent).toContain('body');
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
