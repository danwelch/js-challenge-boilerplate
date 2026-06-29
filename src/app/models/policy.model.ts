/**
 * A single policy number read from the scanner's CSV output.
 *
 * `policyNumber` is intentionally a `string`, not a `number`: scanned policy
 * numbers are fixed-width 9-digit identifiers where leading zeros are
 * significant (e.g. `"000011111"`). Storing them as JS numbers would silently
 * drop leading zeros and risk precision issues
 */
export interface PolicyRecord {
  policyNumber: string;

  /**
   * Whether `policyNumber` passes the mod-11 checksum (US2). Computed once when
   * the record enters the store via `ChecksumValidator`; the table renders it as
   * a per-row status. A `boolean` suffices for US2's valid/invalid split — US4
   * can widen this to a status union (`valid` / `corrected` / `AMB` / `error`).
   */
  valid: boolean;
}
