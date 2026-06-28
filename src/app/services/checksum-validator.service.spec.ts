import { TestBed } from '@angular/core/testing';
import { ChecksumValidator } from './checksum-validator.service';

describe('ChecksumValidator', () => {
  let service: ChecksumValidator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChecksumValidator);
  });

  it("matches the brief's worked examples (457508000 valid, 664371495 invalid)", () => {
    // Canonical examples from the spec sheet — these pin the checksum's weighting
    // direction (leftmost digit carries weight 9), so guard them explicitly.
    expect(service.isValid('457508000')).toBe(true);
    expect(service.isValid('664371495')).toBe(false);
  });

  it('accepts numbers whose weighted-sum checksum is divisible by 11', () => {
    // 457508000 → 187, 123456789 → 165, both multiples of 11.
    expect(service.isValid('457508000')).toBe(true);
    expect(service.isValid('123456789')).toBe(true);
  });

  it('accepts all-zeros (checksum 0 is divisible by 11)', () => {
    expect(service.isValid('000000000')).toBe(true);
  });

  it('rejects numbers that fail the checksum', () => {
    // 457500000 → 155, 111111111 → 45; neither divisible by 11.
    expect(service.isValid('457500000')).toBe(false);
    expect(service.isValid('111111111')).toBe(false);
  });

  it('treats leading zeros as significant digits, not noise', () => {
    // 000000011 → 1·1 + 2·1 = 3, not a multiple of 11.
    expect(service.isValid('000000011')).toBe(false);
  });

  it('rejects tokens that are not exactly nine digits', () => {
    expect(service.isValid('12345')).toBe(false); // too short
    expect(service.isValid('1234567890')).toBe(false); // too long
  });

  it('rejects non-numeric tokens', () => {
    expect(service.isValid('12345678X')).toBe(false);
    expect(service.isValid('abcdefghi')).toBe(false);
    expect(service.isValid('')).toBe(false);
  });

  it('rejects numbers padded with surrounding whitespace', () => {
    // The parser trims tokens before validation; an untrimmed value is invalid.
    expect(service.isValid(' 457508000')).toBe(false);
  });
});
