import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { PanelComponent } from './components/panel/panel.component';
import { PolicyTableComponent } from './components/policy-table/policy-table.component';
import { CsvParserService } from './services/csv-parser.service';
import { PolicyStore } from './store/policy-store.service';

/**
 * Root component and orchestrator for the OCR workflow.
 *
 * It owns the side effect of reading a file and delegates the rest: parsing to
 * `CsvParserService` and state to `PolicyStore`. Keeping the component thin means
 * the interesting logic lives in independently testable units, and later stories
 * (validation, API submission) extend the store rather than this template.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FileUploadComponent, PanelComponent, PolicyTableComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly store = inject(PolicyStore);
  private readonly csvParser = inject(CsvParserService);

  /**
   * Artificial delay (ms) inserted between reading the file and parsing it so
   * the processing state is visible in the demo. Real CSVs of this size parse
   * in microseconds — without this pause the loading state would flash by too
   * fast to be perceived. Remove (or set to 0) for production.
   */
  private readonly DEMO_PROCESSING_DELAY_MS = 1000;

  /** Reads a validated CSV file (browser I/O), then hands the text off to be parsed. */
  async onFileSelected(file: File): Promise<void> {
    this.store.beginProcessing();

    let text: string;
    try {
      text = await file.text();
    } catch {
      this.store.setError({
        filename: file.name,
        message: 'could not be read. Please try again.',
      });
      return;
    }

    // See DEMO_PROCESSING_DELAY_MS above.
    await new Promise((resolve) =>
      setTimeout(resolve, this.DEMO_PROCESSING_DELAY_MS),
    );

    this.loadFromText(text, file.name);
  }

  /**
   * Parses already-read CSV text into the store. Kept separate from the file I/O
   * above so the parse-and-load logic is unit-testable without a real File
   * (whose `.text()` is a browser API); the I/O path is covered by e2e tests.
   */
  loadFromText(text: string, sourceName: string): void {
    const tokens = this.csvParser.parse(text);
    if (tokens.length === 0) {
      this.store.setError({
        filename: sourceName,
        message: 'did not contain any policy numbers.',
      });
      return;
    }
    this.store.setPolicies(tokens, sourceName);
  }
}
