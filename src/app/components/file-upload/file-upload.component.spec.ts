import { ComponentFixture, TestBed } from '@angular/core/testing';
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
function dragLeaveEvent(opts: { related: Node | null; insideZone: boolean }): DragEvent {
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

  it('rejects a non-CSV file with a descriptive error', () => {
    const file = makeFile('policies.txt', 100, 'text/plain');
    let message: string | undefined;
    let emittedValid = false;
    component.validationError.subscribe((m) => (message = m));
    component.fileSelected.subscribe(() => (emittedValid = true));

    component.onFileChange(changeEventFor(file));

    expect(message).toContain('not a CSV');
    expect(emittedValid).toBe(false);
  });

  it('rejects a CSV larger than 2 MB', () => {
    const file = makeFile('big.csv', TWO_MB + 1);
    let message: string | undefined;
    component.validationError.subscribe((m) => (message = m));

    component.onFileChange(changeEventFor(file));

    expect(message).toContain('2 MB');
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
    fixture.componentRef.setInput('error', 'File must be a .csv');
    fixture.detectChanges();

    const alert: HTMLElement | null =
      fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('File must be a .csv');
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
      let message: string | undefined;
      component.validationError.subscribe((m) => (message = m));

      component.onDrop(dropEventFor(file));

      expect(message).toContain('not a CSV');
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

      component.onDragLeave(dragLeaveEvent({ related: null, insideZone: false }));
      expect(component.isDragging()).toBe(false);
    });

    it('keeps drag state while moving onto a child of the drop zone', () => {
      component.onDragOver(dragOverEvent());

      component.onDragLeave(
        dragLeaveEvent({ related: document.createElement('span'), insideZone: true }),
      );

      expect(component.isDragging()).toBe(true);
    });
  });
});
