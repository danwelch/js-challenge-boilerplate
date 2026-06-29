import { Injectable } from '@angular/core';

/** Policy numbers are fixed-width 9-digit identifiers. */
const POLICY_LENGTH = 9;

/** A policy number must be exactly nine ASCII digits — nothing else. */
const DIGITS_ONLY = /^\d{9}$/;

/**
 * Validates a scanned policy number against its mod-11 checksum.
 *
 * The scheme is positional over the 9-digit string: numbering the digits
 * `d9 d8 … d1` from left to right (so `d1` is the rightmost), the number is
 * valid when
 *
 *   (1·d1 + 2·d2 + 3·d3 + … + 9·d9) mod 11 === 0
 *
 * A pure `string → boolean` function (no I/O), mirroring `CsvParserService`, so
 * it is unit-testable without a real `File` or the store. The store is the only
 * consumer: it attaches the result to each `PolicyRecord` (see `PolicyStore`).
 */
@Injectable({ providedIn: 'root' })
export class ChecksumValidator {
  /**
   * @param policyNumber Raw policy number token from the parser.
   * @returns `true` only when the token is nine digits *and* its weighted-sum
   *          checksum is divisible by 11. Anything that isn't nine digits
   *          (wrong length, non-numeric) cannot satisfy a positional checksum,
   *          so it is invalid.
   */
  isValid(policyNumber: string): boolean {
    if (!DIGITS_ONLY.test(policyNumber)) {
      return false;
    }

    let weightedSum = 0;
    for (let i = 0; i < POLICY_LENGTH; i++) {
      // Leftmost digit carries weight 9, rightmost weight 1.
      const weight = POLICY_LENGTH - i;
      weightedSum += weight * Number(policyNumber[i]);
    }

    return weightedSum % 11 === 0;
  }
}
