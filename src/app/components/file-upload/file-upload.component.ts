import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { LucideAngularModule, Upload, FileSpreadsheet } from 'lucide-angular';
import { AlertComponent } from '../alert/alert.component';
import { ButtonDirective } from '../button/button.directive';

/** Maximum accepted file size: 2 MB, expressed in bytes. */
const MAX_BYTES = 2 * 1024 * 1024;

/** MIME types browsers commonly report for `.csv` files. */
const CSV_MIME_TYPES = new Set(['text/csv', 'application/vnd.ms-excel']);

/**
 * Accessible CSV upload control.
 *
 * Validation lives here (it is purely about the file), but the resulting error
 * is *displayed* from the `error` input rather than local state, so the store
 * remains the single source of truth: this component emits validation outcomes
 * upward and renders whatever error the store feeds back down. Valid files are
 * emitted via `fileSelected`; the parent reads and parses them.
 *
 * Three input paths feed the same validate/emit pipeline:
 *  1. The native file picker (the `<label appButton>` + visually-hidden input)
 *     — the keyboard/AT-accessible primary path.
 *  2. Drag-and-drop — a progressive enhancement, mouse-only.
 *  3. A URL field — paste a CSV URL and press Enter to fetch it. Subject to the
 *     remote server's CORS headers; the input also displays the current file
 *     name after a pick or drop, so it doubles as "file location" feedback.
 *
 * Accessibility notes:
 *  - The native `<input type="file">` is visually hidden but stays in the tab
 *    order; the `<label appButton>` shows a focus ring via `:focus-within`.
 *  - Errors render in a `role="alert"` region so screen readers announce them,
 *    and the input is wired to them with `aria-describedby` / `aria-invalid`.
 *  - Icons are decorative (`aria-hidden`); meaning is carried by the text.
 */
@Component({
  selector: 'app-file-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ButtonDirective, AlertComponent],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent {
  /** Lucide icon used for the upload button. */
  protected readonly UploadIcon = Upload;
  protected readonly FileSpreadsheetIcon = FileSpreadsheet;

  /** Error message to display (driven by the store), or `null` when clear. */
  readonly error = input<string | null>(null);

  /** Emits the validated `File` when a valid CSV is chosen. */
  readonly fileSelected = output<File>();

  /** Emits a human-readable message when the chosen file fails validation. */
  readonly validationError = output<string>();

  /** Whether a file is currently being dragged over the drop zone. */
  readonly isDragging = signal(false);

  /**
   * Current text in the URL/file-location input. Doubles as the selected file
   * name display: when a file is picked or dropped successfully, we set this to
   * the file's name so the input always reflects "what is currently loaded."
   */
  readonly urlOrFileName = signal('');

  /** Handles a file chosen via the file picker. */
  onFileChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (file) {
      this.handleFile(file);
    }
    // Clear the value so re-selecting the same file fires `change` again.
    inputEl.value = '';
  }

  /** Tracks edits to the URL/file-location input. */
  onUrlInput(event: Event): void {
    this.urlOrFileName.set((event.target as HTMLInputElement).value);
  }

  /**
   * Submits the URL field: parses it as a URL, fetches the response as a Blob,
   * wraps it in a `File`, and runs it through the same validation pipeline.
   * Network requests are subject to the remote server's CORS policy.
   */
  async onUrlSubmit(): Promise<void> {
    const value = this.urlOrFileName().trim();
    if (!value) {
      return;
    }

    let url: URL;
    try {
      url = new URL(value);
    } catch {
      this.validationError.emit(
        `<code>${escapeHtml(value)}</code> is not a valid URL.`,
      );
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        this.validationError.emit(
          `Could not fetch <code>${escapeHtml(value)}</code> (HTTP ${response.status}).`,
        );
        return;
      }
      const blob = await response.blob();
      const file = new File([blob], filenameFromUrl(url), {
        type: blob.type || 'text/csv',
      });
      this.handleFile(file);
    } catch {
      this.validationError.emit(
        `Could not fetch <code>${escapeHtml(value)}</code>. Check the URL and that the host allows CORS.`,
      );
    }
  }

  /** Allows the drop zone to receive a file and shows the active state. */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    // Ignore dragleave events fired while moving onto a child of the drop zone.
    const related = event.relatedTarget as Node | null;
    if (related && (event.currentTarget as HTMLElement).contains(related)) {
      return;
    }
    this.isDragging.set(false);
  }

  /** Handles a file dropped onto the drop zone (same path as the picker). */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  /** Validates a file and emits either the file or a validation error. */
  private handleFile(file: File): void {
    const error = this.validate(file);
    if (error) {
      this.validationError.emit(error);
    } else {
      this.urlOrFileName.set(file.name);
      this.fileSelected.emit(file);
    }
  }

  /** Returns an error message if the file is not an acceptable CSV, else `null`. */
  private validate(file: File): string | null {
    const isCsv =
      file.name.toLowerCase().endsWith('.csv') || CSV_MIME_TYPES.has(file.type);
    if (!isCsv) {
      return `<code>${file.name}</code> is not a CSV file. Please upload a .csv file.`;
    }

    if (file.size > MAX_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return `<code>${file.name}</code> is ${sizeMb} MB, which exceeds the 2 MB limit.`;
    }

    return null;
  }
}

/** Minimal HTML escape for values we inject into error messages as `<code>`. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Derives a filename from the last path segment of a URL, falling back if absent. */
function filenameFromUrl(url: URL): string {
  const last = url.pathname.split('/').filter(Boolean).pop();
  return last || 'remote.csv';
}
