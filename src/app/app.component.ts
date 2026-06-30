import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  computed,
  inject,
  isDevMode,
} from '@angular/core';
import { Inbox, LoaderCircle, LucideAngularModule } from 'lucide-angular';
import type { SubmitResult } from './models/submit-result.model';
import { AlertComponent } from './components/alert/alert.component';
import { ButtonDirective } from './components/button/button.directive';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { PanelComponent } from './components/panel/panel.component';
import { PolicyTableComponent } from './components/policy-table/policy-table.component';
import { CsvParserService } from './services/csv-parser.service';
import { PolicyApiService } from './services/policy-api.service';
import { PolicyStore } from './store/policy-store.service';

/**
 * Minimum time the processing state (and its loading skeleton) stays on screen,
 * measured from the start of an upload. Real CSVs of this size parse in
 * microseconds, so without a floor the skeleton would flash for a single frame
 * and read as a glitch. The **400ms production floor** keeps it visible long
 * enough to register as a deliberate loading state; development uses 1000ms so
 * the state is easy to see while building. Exposed as an injection token so
 * tests can pin a deterministic value.
 */
export const MIN_PROCESSING_MS = new InjectionToken<number>('MIN_PROCESSING_MS', {
  providedIn: 'root',
  factory: () => (isDevMode() ? 1000 : 400),
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
  imports: [FileUploadComponent, PanelComponent, PolicyTableComponent, LucideAngularModule, ButtonDirective, AlertComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly store = inject(PolicyStore);
  private readonly csvParser = inject(CsvParserService);
  private readonly policyApi = inject(PolicyApiService);
  private readonly minProcessingMs = inject(MIN_PROCESSING_MS);

  /** Decorative icon for the empty Results panel. */
  protected readonly emptyIcon = Inbox;
  protected readonly spinnerIcon = LoaderCircle;

  /** Drives a persistent polite live region so SR users hear upload progress.
   *  Errors are intentionally omitted — AlertComponent already announces them. */
  protected readonly statusMessage = computed(() => {
    if (this.store.processing()) {
      return 'Processing upload…';
    }
    const policies = this.store.policies();
    if (policies.length === 0) {
      return '';
    }
    const valid = policies.filter((policy) => policy.valid).length;
    const invalid = policies.length - valid;
    return `Loaded ${policies.length} policy numbers — ${valid} valid, ${invalid} ${invalid === 1 ? 'error' : 'errors'}.`;
  });

  /** Reads a validated CSV file (browser I/O), then hands the text off to be parsed. */
  async onFileSelected(file: File): Promise<void> {
    this.store.beginProcessing();
    const startedAt = performance.now();

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

    // Hold the loading skeleton for at least the floor so it never flickers.
    await this.holdFloor(startedAt);

    this.loadFromText(text, file.name);
  }

  /** POSTs the current policies to the API and stores the result. */
  async onSubmit(): Promise<void> {
    if (this.store.submitting()) return;
    this.store.beginSubmit();
    const policies = this.store.policies();
    const startedAt = performance.now();

    let result: SubmitResult;
    try {
      const { id } = await this.policyApi.submit(policies);
      const count = policies.length;
      result = { status: 'success', message: `Submitted ${count} policy number${count === 1 ? '' : 's'}.`, id };
    } catch (error) {
      console.error('Policy submission failed', error);
      result = { status: 'error', message: 'Submission failed. Please try again.' };
    }

    await this.holdFloor(startedAt);
    // A concurrent upload replaces the policies array; if that happened mid-flight,
    // this result is stale — drop it rather than reviving cleared submit state.
    if (this.store.policies() !== policies) return;
    this.store.setSubmitResult(result);
  }

  /**
   * Hold a loading state on screen until at least the `MIN_PROCESSING_MS` floor has
   * elapsed since `startedAt`, so it never flickers. Sleeps only the *remaining* time,
   * so a genuinely slow read/POST isn't padded.
   */
  private async holdFloor(startedAt: number): Promise<void> {
    const remaining = this.minProcessingMs - (performance.now() - startedAt);
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
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
