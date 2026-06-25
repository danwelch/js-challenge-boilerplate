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

  /** Policy records loaded from the most recent successful upload. */
  readonly policies = this._policies.asReadonly();

  /** Human-readable error from the most recent failed upload, or `null`. */
  readonly uploadError = this._uploadError.asReadonly();

  /** Whether there are any policies currently loaded. */
  readonly hasPolicies = computed(() => this._policies().length > 0);

  /** Load policies from parsed CSV tokens, clearing any previous error. */
  setPolicies(tokens: string[]): void {
    this._policies.set(tokens.map((policyNumber) => ({ policyNumber })));
    this._uploadError.set(null);
  }

  /** Record an upload error, clearing any previously loaded policies. */
  setError(message: string): void {
    this._uploadError.set(message);
    this._policies.set([]);
  }

  /** Reset the store to its initial empty state. */
  reset(): void {
    this._policies.set([]);
    this._uploadError.set(null);
  }
}
