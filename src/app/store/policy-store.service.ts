import { Injectable, computed, signal } from '@angular/core';
import { PolicyRecord } from '../models/policy.model';

/**
 * Single source of truth for the policy upload feature, built on Angular signals.
 *
 * A small signal-based store keeps the components thin and the state logic
 * unit-testable in isolation. It also gives the later user stories a natural
 * home to grow into: US2 adds validation, US3 adds API submission state — each
 * is a new signal and action here rather than a change to existing components.
 *
 * State is exposed as read-only signals; mutation only happens through the
 * intent-named actions below. `setPolicies` and `setError` are deliberately
 * symmetric: each represents the outcome of a single upload attempt, so a new
 * attempt always replaces the previous result rather than layering on stale data.
 */
@Injectable({ providedIn: 'root' })
export class PolicyStore {
  private readonly _policies = signal<PolicyRecord[]>([]);
  private readonly _uploadError = signal<string | null>(null);
  private readonly _sourceName = signal<string | null>(null);
  private readonly _processing = signal(false);

  /** Policy records loaded from the most recent successful upload. */
  readonly policies = this._policies.asReadonly();

  /** Human-readable error from the most recent failed upload, or `null`. */
  readonly uploadError = this._uploadError.asReadonly();

  /** Filename of the CSV that produced the current policies, or `null`. */
  readonly sourceName = this._sourceName.asReadonly();

  /**
   * Whether an upload is currently being processed (file is being read/parsed).
   * Story 3 can extend this hook for API submission without changing consumers.
   */
  readonly processing = this._processing.asReadonly();

  /** Whether there are any policies currently loaded. */
  readonly hasPolicies = computed(() => this._policies().length > 0);

  /** Flag the start of an upload so the UI can show its processing state. */
  beginProcessing(): void {
    this._processing.set(true);
  }

  /** Load policies from parsed CSV tokens; clears errors and the processing flag. */
  setPolicies(tokens: string[], sourceName: string): void {
    this._policies.set(tokens.map((policyNumber) => ({ policyNumber })));
    this._sourceName.set(sourceName);
    this._uploadError.set(null);
    this._processing.set(false);
  }

  /** Record an upload error; clears any loaded policies and the processing flag. */
  setError(message: string): void {
    this._uploadError.set(message);
    this._policies.set([]);
    this._sourceName.set(null);
    this._processing.set(false);
  }

  /** Reset the store to its initial empty state. */
  reset(): void {
    this._policies.set([]);
    this._uploadError.set(null);
    this._sourceName.set(null);
    this._processing.set(false);
  }
}
