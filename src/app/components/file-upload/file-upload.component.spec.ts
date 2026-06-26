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

  describe('URL field', () => {
    /** Builds an input-event-like value carrier. */
    function inputEventFor(value: string): Event {
      return { target: { value } } as unknown as Event;
    }

    /** Stubs globalThis.fetch with a fixed response, returns the original. */
    function stubFetch(impl: (input: URL | string) => Promise<Response>): () => void {
      const original = globalThis.fetch;
      globalThis.fetch = ((input: URL | string) => impl(input)) as typeof fetch;
      return () => {
        globalThis.fetch = original;
      };
    }

    it('updates the displayed value as the user types', () => {
      component.onUrlInput(inputEventFor('https://example.com/policies.csv'));
      expect(component.urlOrFileName()).toBe('https://example.com/policies.csv');
    });

    it('does nothing when the field is empty', async () => {
      let emittedValid = false;
      let errored = false;
      component.fileSelected.subscribe(() => (emittedValid = true));
      component.validationError.subscribe(() => (errored = true));

      await component.onUrlSubmit();

      expect(emittedValid).toBe(false);
      expect(errored).toBe(false);
    });

    it('rejects submissions that are not valid URLs', async () => {
      let message: string | undefined;
      component.validationError.subscribe((m) => (message = m));
      component.urlOrFileName.set('not a url');

      await component.onUrlSubmit();

      expect(message).toContain('not a valid URL');
    });

    it('fetches the URL, builds a File, and emits it', async () => {
      const restore = stubFetch(async () =>
        new Response('457508000,123456789', {
          status: 200,
          headers: { 'Content-Type': 'text/csv' },
        }),
      );
      let emitted: File | undefined;
      component.fileSelected.subscribe((f) => (emitted = f));
      component.urlOrFileName.set('https://example.com/remote/policies.csv');

      try {
        await component.onUrlSubmit();
      } finally {
        restore();
      }

      expect(emitted).toBeDefined();
      expect(emitted!.name).toBe('policies.csv');
      // Validation pipeline accepted it → field reflects the loaded name.
      expect(component.urlOrFileName()).toBe('policies.csv');
    });

    it('reports an HTTP error from the fetch response', async () => {
      const restore = stubFetch(async () => new Response('nope', { status: 404 }));
      let message: string | undefined;
      component.validationError.subscribe((m) => (message = m));
      component.urlOrFileName.set('https://example.com/missing.csv');

      try {
        await component.onUrlSubmit();
      } finally {
        restore();
      }

      expect(message).toContain('HTTP 404');
    });

    it('reports a network/CORS failure from a rejected fetch', async () => {
      const restore = stubFetch(async () => {
        throw new TypeError('Failed to fetch');
      });
      let message: string | undefined;
      component.validationError.subscribe((m) => (message = m));
      component.urlOrFileName.set('https://example.com/blocked.csv');

      try {
        await component.onUrlSubmit();
      } finally {
        restore();
      }

      expect(message).toContain('CORS');
    });

    it('runs the same CSV/size validation on the fetched file', async () => {
      // Fetched as text/plain → not a CSV name, not a CSV MIME → rejected.
      const restore = stubFetch(async () =>
        new Response('hello', { status: 200, headers: { 'Content-Type': 'text/plain' } }),
      );
      let message: string | undefined;
      component.validationError.subscribe((m) => (message = m));
      // Path's last segment has no extension, so name check fails too.
      component.urlOrFileName.set('https://example.com/garbage');

      try {
        await component.onUrlSubmit();
      } finally {
        restore();
      }

      expect(message).toContain('not a CSV');
    });

    it('updates the field to the file name after a successful pick', () => {
      const file = makeFile('picked.csv', 100);

      component.onFileChange(changeEventFor(file));

      expect(component.urlOrFileName()).toBe('picked.csv');
    });
  });
});
