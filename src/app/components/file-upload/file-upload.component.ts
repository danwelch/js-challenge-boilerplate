import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FileCheck,
  FileSpreadsheet,
  LoaderCircle,
  LucideAngularModule,
  RotateCcw,
  Upload,
} from 'lucide-angular';
import type { UploadError } from '../../models/upload-error.model';
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
 * Drag-and-drop is a progressive enhancement: dropping a file runs the exact
 * same validation/emit path as the picker. Because drag-and-drop is mouse-only,
 * the visually-hidden `<input>` + `<label>` remain the keyboard/AT-accessible way
 * to choose a file.
 *
 * The component is fully controlled by its inputs: passing a non-null
 * `currentFile` switches the UI to a compact "loaded file" state with a smaller
 * "Choose another file" button and a secondary "Reset" button. The parent owns
 * what `currentFile` means (typically the store's source filename) and decides
 * what `reset` does (typically `store.reset()`), so this component stays
 * presentational and the store remains the single source of truth.
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
  imports: [
    LucideAngularModule,
    ButtonDirective,
    AlertComponent,
    NgTemplateOutlet,
  ],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent {
  /** Lucide icons used in the template. */
  protected readonly UploadIcon = Upload;
  protected readonly FileSpreadsheetIcon = FileSpreadsheet;
  protected readonly FileCheckIcon = FileCheck;
  protected readonly ResetIcon = RotateCcw;
  protected readonly SpinnerIcon = LoaderCircle;

  /** Error to display (driven by the store), or `null` when clear. */
  readonly error = input<UploadError | null>(null);

  /**
   * Name of the file currently loaded into the parent's state, or `null`.
   * When set, the component renders the compact "loaded" state instead of the
   * full drop zone.
   */
  readonly currentFile = input<string | null>(null);

  /**
   * Whether an upload is currently being processed. When `true`, the upload
   * button shows a spinner and the form is grayed out / inert so the user
   * can't start a second pick while the first one is in flight.
   */
  readonly processing = input<boolean>(false);

  /** Emits the validated `File` when a valid CSV is chosen. */
  readonly fileSelected = output<File>();

  /** Emits a structured error when the chosen file fails validation. */
  readonly validationError = output<UploadError>();

  /** Emits when the user clicks "Reset" in the collapsed state. */
  readonly reset = output<void>();

  /** Whether a file is currently being dragged over the drop zone. */
  readonly isDragging = signal(false);

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

  /** Clears the loaded file and re-expands the upload control. */
  onReset(): void {
    this.reset.emit();
  }

  /** Validates a file and emits either the file or a validation error. */
  private handleFile(file: File): void {
    const error = this.validate(file);
    if (error) {
      this.validationError.emit(error);
    } else {
      this.fileSelected.emit(file);
    }
  }

  /** Returns a structured error if the file is not an acceptable CSV, else `null`. */
  private validate(file: File): UploadError | null {
    const isCsv =
      file.name.toLowerCase().endsWith('.csv') || CSV_MIME_TYPES.has(file.type);
    if (!isCsv) {
      return {
        filename: file.name,
        message: 'is not a CSV file. Please upload a .csv file.',
      };
    }

    if (file.size > MAX_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return {
        filename: file.name,
        message: `is ${sizeMb} MB, which exceeds the 2 MB limit.`,
      };
    }

    return null;
  }
}
