import { TestBed } from '@angular/core/testing';
import { PolicyStore } from './policy-store.service';

describe('PolicyStore', () => {
  let store: PolicyStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(PolicyStore);
  });

  it('starts empty with no error', () => {
    expect(store.policies()).toEqual([]);
    expect(store.uploadError()).toBeNull();
    expect(store.hasPolicies()).toBe(false);
    expect(store.processing()).toBe(false);
  });

  it('maps tokens into PolicyRecords with checksum validity and clears any error', () => {
    store.setError({ message: 'previous problem' });

    store.setPolicies(['457508000', '123456789'], 'policies.csv');

    expect(store.policies()).toEqual([
      { policyNumber: '457508000', valid: true },
      { policyNumber: '123456789', valid: true },
    ]);
    expect(store.sourceName()).toBe('policies.csv');
    expect(store.hasPolicies()).toBe(true);
    expect(store.uploadError()).toBeNull();
  });

  it('flags each record as valid or invalid by its mod-11 checksum', () => {
    // 457508000 passes the checksum; 457500000 does not.
    store.setPolicies(['457508000', '457500000'], 'policies.csv');

    expect(store.policies()).toEqual([
      { policyNumber: '457508000', valid: true },
      { policyNumber: '457500000', valid: false },
    ]);
  });

  it('records an error and clears any loaded policies', () => {
    store.setPolicies(['457508000'], 'policies.csv');

    store.setError({ filename: 'notes.txt', message: 'is not a CSV file.' });

    expect(store.uploadError()).toEqual({
      filename: 'notes.txt',
      message: 'is not a CSV file.',
    });
    expect(store.policies()).toEqual([]);
    expect(store.sourceName()).toBeNull();
    expect(store.hasPolicies()).toBe(false);
  });

  it('reset() returns to the initial empty state', () => {
    store.setPolicies(['457508000'], 'policies.csv');

    store.reset();

    expect(store.policies()).toEqual([]);
    expect(store.uploadError()).toBeNull();
    expect(store.sourceName()).toBeNull();
    expect(store.processing()).toBe(false);
  });

  describe('processing flag', () => {
    it('beginProcessing() flips the flag on', () => {
      store.beginProcessing();
      expect(store.processing()).toBe(true);
    });

    it('setPolicies() ends the processing state on success', () => {
      store.beginProcessing();
      store.setPolicies(['457508000'], 'policies.csv');
      expect(store.processing()).toBe(false);
    });

    it('setError() ends the processing state on failure', () => {
      store.beginProcessing();
      store.setError({ message: 'File must be a .csv' });
      expect(store.processing()).toBe(false);
    });

    it('reset() clears the processing state', () => {
      store.beginProcessing();
      store.reset();
      expect(store.processing()).toBe(false);
    });
  });

  describe('submit slice', () => {
    it('starts with submitting false and no result', () => {
      expect(store.submitting()).toBe(false);
      expect(store.submitResult()).toBeNull();
    });

    it('beginSubmit() sets submitting and clears any prior result', () => {
      store.setSubmitResult({ status: 'success', message: 'done', id: 1 });
      store.beginSubmit();
      expect(store.submitting()).toBe(true);
      expect(store.submitResult()).toBeNull();
    });

    it('setSubmitResult() stores the result and clears submitting', () => {
      store.beginSubmit();
      store.setSubmitResult({ status: 'success', message: 'Submitted 1 policy number.', id: 101 });
      expect(store.submitting()).toBe(false);
      expect(store.submitResult()).toEqual({ status: 'success', message: 'Submitted 1 policy number.', id: 101 });
    });

    it('setSubmitResult() stores an error result', () => {
      store.beginSubmit();
      store.setSubmitResult({ status: 'error', message: 'Submission failed. Please try again.' });
      expect(store.submitResult()).toEqual({ status: 'error', message: 'Submission failed. Please try again.' });
    });

    it('reset() clears the submit slice', () => {
      store.beginSubmit();
      store.setSubmitResult({ status: 'success', message: 'done', id: 1 });
      store.reset();
      expect(store.submitting()).toBe(false);
      expect(store.submitResult()).toBeNull();
    });

    it('setPolicies() clears the submit slice', () => {
      store.setSubmitResult({ status: 'success', message: 'done', id: 1 });
      store.setPolicies(['457508000'], 'new.csv');
      expect(store.submitting()).toBe(false);
      expect(store.submitResult()).toBeNull();
    });

    it('setError() clears the submit slice', () => {
      store.setSubmitResult({ status: 'success', message: 'done', id: 1 });
      store.setError({ message: 'bad file' });
      expect(store.submitting()).toBe(false);
      expect(store.submitResult()).toBeNull();
    });

    it('beginProcessing() clears the submit slice so a new upload drops a prior result', () => {
      store.setSubmitResult({ status: 'success', message: 'done', id: 1 });
      store.beginProcessing();
      expect(store.submitting()).toBe(false);
      expect(store.submitResult()).toBeNull();
    });
  });
});
