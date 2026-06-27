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

  it('maps tokens into PolicyRecords and clears any error', () => {
    store.setError('previous problem');

    store.setPolicies(['457508000', '123456789'], 'policies.csv');

    expect(store.policies()).toEqual([
      { policyNumber: '457508000' },
      { policyNumber: '123456789' },
    ]);
    expect(store.sourceName()).toBe('policies.csv');
    expect(store.hasPolicies()).toBe(true);
    expect(store.uploadError()).toBeNull();
  });

  it('records an error and clears any loaded policies', () => {
    store.setPolicies(['457508000'], 'policies.csv');

    store.setError('File must be a .csv');

    expect(store.uploadError()).toBe('File must be a .csv');
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
      store.setError('File must be a .csv');
      expect(store.processing()).toBe(false);
    });

    it('reset() clears the processing state', () => {
      store.beginProcessing();
      store.reset();
      expect(store.processing()).toBe(false);
    });
  });
});
