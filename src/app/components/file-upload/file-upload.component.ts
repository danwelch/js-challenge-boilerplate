import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

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
 * Accessibility notes:
 *  - The native `<input type="file">` is visually hidden but stays in the tab
 *    order; the styled `<label>` shows a focus ring via `:focus-within`.
 *  - Errors render in a `role="alert"` region so screen readers announce them,
 *    and the input is wired to them with `aria-describedby` / `aria-invalid`.
 */
@Component({
  selector: 'app-file-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent {
  /** Error message to display (driven by the store), or `null` when clear. */
  readonly error = input<string | null>(null);

  /** Emits the validated `File` when a valid CSV is chosen. */
  readonly fileSelected = output<File>();

  /** Emits a human-readable message when the chosen file fails validation. */
  readonly validationError = output<string>();

  /** Handles a file being chosen, validating before emitting. */
  onFileChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];

    if (file) {
      const error = this.validate(file);
      if (error) {
        this.validationError.emit(error);
      } else {
        this.fileSelected.emit(file);
      }
    }

    // Clear the value so re-selecting the same file fires `change` again.
    inputEl.value = '';
  }

  /** Returns an error message if the file is not an acceptable CSV, else `null`. */
  private validate(file: File): string | null {
    const isCsv =
      file.name.toLowerCase().endsWith('.csv') || CSV_MIME_TYPES.has(file.type);
    if (!isCsv) {
      return `“${file.name}” is not a CSV file. Please upload a .csv file.`;
    }

    if (file.size > MAX_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return `“${file.name}” is ${sizeMb} MB, which exceeds the 2 MB limit.`;
    }

    return null;
  }
}
