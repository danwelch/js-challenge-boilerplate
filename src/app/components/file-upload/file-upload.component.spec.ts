import { type ComponentFixture, TestBed } from '@angular/core/testing';
import type { UploadError } from '../../models/upload-error.model';
import { FileUploadComponent } from './file-upload.component';

/** Builds a File of an exact byte size with the given name/type. */
function makeFile(name: string, bytes: number, type = 'text/csv'): File {
  return new File([new ArrayBuffer(bytes)], name, { type });
}

/** Simulates an <input type="file"> change event carrying the given file. */
function changeEventFor(file: File | null): Event {
  const inputEl = { files: file ? [file] : [], value: 'x' };
  return { target: inputEl } as unknown as Event;
}

/** Simulates a drop event whose dataTransfer carries the given file. */
function dropEventFor(file: File | null): DragEvent {
  return {
    preventDefault: () => {},
    dataTransfer: { files: file ? [file] : [] },
  } as unknown as DragEvent;
}

/** Simulates a dragover event. */
function dragOverEvent(): DragEvent {
  return { preventDefault: () => {} } as unknown as DragEvent;
}

/** Simulates a dragleave event, optionally moving onto a child of the zone. */
function dragLeaveEvent(opts: {
  related: Node | null;
  insideZone: boolean;
}): DragEvent {
  return {
    preventDefault: () => {},
    relatedTarget: opts.related,
    currentTarget: { contains: () => opts.insideZone },
  } as unknown as DragEvent;
}

const TWO_MB = 2 * 1024 * 1024;

describe('FileUploadComponent', () => {
  let fixture: ComponentFixture<FileUploadComponent>;
  let component: FileUploadComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [FileUploadComponent] });
    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emits the file when a valid .csv under 2 MB is selected', () => {
    const file = makeFile('policies.csv', 100);
    let emitted: File | undefined;
    let errored = false;
    component.fileSelected.subscribe((f) => (emitted = f));
    component.validationError.subscribe(() => (errored = true));

    component.onFileChange(changeEventFor(file));

    expect(emitted).toBe(file);
    expect(errored).toBe(false);
  });

  it('accepts a .csv with an empty MIME type (some browsers report none)', () => {
    const file = makeFile('policies.csv', 100, '');
    let emitted: File | undefined;
    component.fileSelected.subscribe((f) => (emitted = f));

    component.onFileChange(changeEventFor(file));

    expect(emitted).toBe(file);
  });

  it('accepts a .csv reported as application/vnd.ms-excel', () => {
    const file = makeFile('policies.csv', 100, 'application/vnd.ms-excel');
    let emitted: File | undefined;
    component.fileSelected.subscribe((f) => (emitted = f));

    component.onFileChange(changeEventFor(file));

    expect(emitted).toBe(file);
  });

  it('rejects a non-CSV file with a structured error naming the file', () => {
    const file = makeFile('notes.txt', 100, 'text/plain');
    let error: UploadError | undefined;
    let emittedValid = false;
    component.validationError.subscribe((e) => (error = e));
    component.fileSelected.subscribe(() => (emittedValid = true));

    component.onFileChange(changeEventFor(file));

    expect(error).toEqual({
      filename: 'notes.txt',
      message: 'is not a CSV file. Please upload a .csv file.',
    });
    expect(emittedValid).toBe(false);
  });

  it('rejects a CSV larger than 2 MB with the actual size in the message', () => {
    const file = makeFile('big.csv', TWO_MB + 1);
    let error: UploadError | undefined;
    component.validationError.subscribe((e) => (error = e));

    component.onFileChange(changeEventFor(file));

    expect(error?.filename).toBe('big.csv');
    expect(error?.message).toContain('2 MB');
  });

  it('accepts a CSV of exactly 2 MB (boundary)', () => {
    const file = makeFile('edge.csv', TWO_MB);
    let emitted: File | undefined;
    component.fileSelected.subscribe((f) => (emitted = f));

    component.onFileChange(changeEventFor(file));

    expect(emitted).toBe(file);
  });

  it('does nothing when no file is chosen (e.g. dialog cancelled)', () => {
    let emittedValid = false;
    let errored = false;
    component.fileSelected.subscribe(() => (emittedValid = true));
    component.validationError.subscribe(() => (errored = true));

    component.onFileChange(changeEventFor(null));

    expect(emittedValid).toBe(false);
    expect(errored).toBe(false);
  });

  it('renders the error input in an assertive alert region', () => {
    fixture.componentRef.setInput('error', {
      filename: 'notes.txt',
      message: 'is not a CSV file.',
    });
    fixture.detectChanges();

    const alert: HTMLElement | null =
      fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('notes.txt');
    expect(alert?.textContent).toContain('is not a CSV file.');
  });

  it('escapes filenames in errors — never parses them as HTML (XSS guard)', () => {
    const hostile = '<img src=x onerror=alert(1)>policies.csv';
    fixture.componentRef.setInput('error', {
      filename: hostile,
      message: 'is not a CSV file.',
    });
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector(
      '[role="alert"]',
    ) as HTMLElement;
    // The hostile filename round-trips as plain text inside a <code> element…
    const code = alert.querySelector('code') as HTMLElement;
    expect(code.textContent).toBe(hostile);
    // …and is never parsed as a real <img> element.
    expect(alert.querySelector('img')).toBeNull();
  });

  describe('drag and drop', () => {
    it('emits the file when a valid CSV is dropped', () => {
      const file = makeFile('policies.csv', 100);
      let emitted: File | undefined;
      component.fileSelected.subscribe((f) => (emitted = f));

      component.onDrop(dropEventFor(file));

      expect(emitted).toBe(file);
      expect(component.isDragging()).toBe(false);
    });

    it('runs the same validation for a dropped non-CSV file', () => {
      const file = makeFile('notes.txt', 100, 'text/plain');
      let error: UploadError | undefined;
      component.validationError.subscribe((e) => (error = e));

      component.onDrop(dropEventFor(file));

      expect(error?.filename).toBe('notes.txt');
      expect(error?.message).toContain('not a CSV');
    });

    it('does nothing when a drop carries no file', () => {
      let emittedValid = false;
      let errored = false;
      component.fileSelected.subscribe(() => (emittedValid = true));
      component.validationError.subscribe(() => (errored = true));

      component.onDrop(dropEventFor(null));

      expect(emittedValid).toBe(false);
      expect(errored).toBe(false);
    });

    it('flags drag state on dragover and clears it when leaving the zone', () => {
      component.onDragOver(dragOverEvent());
      expect(component.isDragging()).toBe(true);

      component.onDragLeave(
        dragLeaveEvent({ related: null, insideZone: false }),
      );
      expect(component.isDragging()).toBe(false);
    });

    it('keeps drag state while moving onto a child of the drop zone', () => {
      component.onDragOver(dragOverEvent());

      component.onDragLeave(
        dragLeaveEvent({
          related: document.createElement('span'),
          insideZone: true,
        }),
      );

      expect(component.isDragging()).toBe(true);
    });
  });

  describe('collapsed (current file) mode', () => {
    function setCurrentFile(name: string | null): void {
      fixture.componentRef.setInput('currentFile', name);
      fixture.detectChanges();
    }

    it('renders the drop zone when no current file is set', () => {
      setCurrentFile(null);

      const root = fixture.nativeElement as HTMLElement;
      expect(root.querySelector('.upload__dropzone')).not.toBeNull();
      expect(root.querySelector('.upload__current')).toBeNull();
    });

    it('renders the current-file panel and Reset button when a file is loaded', () => {
      setCurrentFile('sample.csv');

      const root = fixture.nativeElement as HTMLElement;
      expect(root.querySelector('.upload__dropzone')).toBeNull();
      expect(root.querySelector('.upload__current')?.textContent).toContain(
        'sample.csv',
      );
      const resetBtn = root.querySelector(
        'button[appButton]',
      ) as HTMLButtonElement | null;
      expect(resetBtn?.textContent).toContain('Reset');
    });

    it('emits reset when the Reset button is clicked', () => {
      setCurrentFile('sample.csv');
      let resetCount = 0;
      component.reset.subscribe(() => resetCount++);

      const resetBtn = fixture.nativeElement.querySelector(
        'button[appButton]',
      ) as HTMLButtonElement;
      resetBtn.click();

      expect(resetCount).toBe(1);
    });

    it('still emits fileSelected when a new file is picked while collapsed', () => {
      setCurrentFile('sample.csv');
      const next = makeFile('newer.csv', 100);
      let emitted: File | undefined;
      component.fileSelected.subscribe((f) => (emitted = f));

      component.onFileChange(changeEventFor(next));

      expect(emitted).toBe(next);
    });
  });

  describe('processing state', () => {
    function setProcessing(value: boolean): void {
      fixture.componentRef.setInput('processing', value);
      fixture.detectChanges();
    }

    it('does not flag the wrapper as busy when idle', () => {
      setProcessing(false);
      const wrapper = fixture.nativeElement.querySelector(
        '.upload',
      ) as HTMLElement;
      expect(wrapper.classList.contains('upload--processing')).toBe(false);
      expect(wrapper.getAttribute('aria-busy')).toBeNull();
    });

    it('grays out the form and marks it busy while processing', () => {
      setProcessing(true);
      const wrapper = fixture.nativeElement.querySelector(
        '.upload',
      ) as HTMLElement;
      expect(wrapper.classList.contains('upload--processing')).toBe(true);
      expect(wrapper.getAttribute('aria-busy')).toBe('true');
    });

    it('swaps the upload-button icon for a spinner and labels it "Processing…"', () => {
      setProcessing(true);
      const root = fixture.nativeElement as HTMLElement;
      const label = root.querySelector('label[appButton]') as HTMLLabelElement;
      expect(label.querySelector('.upload__spinner')).not.toBeNull();
      expect(label.textContent).toContain('Processing');
    });

    it('renders the spinner in the collapsed mode too', () => {
      fixture.componentRef.setInput('currentFile', 'sample.csv');
      setProcessing(true);
      const label = fixture.nativeElement.querySelector(
        'label[appButton]',
      ) as HTMLLabelElement;
      expect(label.querySelector('.upload__spinner')).not.toBeNull();
    });
  });
});
