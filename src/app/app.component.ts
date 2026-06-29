import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  inject,
  isDevMode,
} from '@angular/core';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { PanelComponent } from './components/panel/panel.component';
import { PolicyTableComponent } from './components/policy-table/policy-table.component';
import { ChecksumValidator } from './services/checksum-validator.service';
import { CsvParserService } from './services/csv-parser.service';
import { PolicyStore } from './store/policy-store.service';

/**
 * Artificial delay inserted between reading the file and parsing it so the
 * processing state is visible during local development. Real CSVs of this size
 * parse in microseconds — without this pause the loading state would flash by
 * too fast to notice. Defaults to 0 in production (no `await`, no overhead) and
 * is exposed as an injection token so tests can pin a deterministic value.
 */
export const DEMO_DELAY_MS = new InjectionToken<number>('DEMO_DELAY_MS', {
  providedIn: 'root',
  factory: () => (isDevMode() ? 1000 : 0),
});

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
  private readonly checksumValidator = inject(ChecksumValidator);
  private readonly demoDelayMs = inject(DEMO_DELAY_MS);

  /**
   * Placeholder rows shown — blurred and aria-hidden — behind the empty-state
   * prompt so the panel previews what a loaded result looks like. Five rows is
   * enough to read as a table without dominating the panel. The validity flag is
   * computed for real (not hard-coded) so the previewed status column is honest.
   */
  protected readonly placeholderPolicies = [
    '457500000',
    '664371495',
    '333333333',
    '457508000',
    '861100036',
  ].map((policyNumber) => ({
    policyNumber,
    valid: this.checksumValidator.isValid(policyNumber),
  }));

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

    if (this.demoDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.demoDelayMs));
    }

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
