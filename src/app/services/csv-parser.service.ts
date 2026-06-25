import { Injectable } from '@angular/core';

/**
 * Parses the raw text of the scanner's CSV export into a flat list of policy
 * number tokens.
 *
 * Assumptions about the format (documented in the README):
 *  - There is no header row.
 *  - Values may be separated by commas, newlines, or both — the provided
 *    `sample.csv` is a single comma-separated line, but a one-value-per-line
 *    export is handled identically.
 *  - Surrounding whitespace and blank entries (e.g. a trailing comma) are
 *    insignificant and dropped.
 *  - Duplicates are preserved: the scanner can legitimately read the same
 *    policy twice, and de-duping is a business decision we don't make here.
 */
@Injectable({ providedIn: 'root' })
export class CsvParserService {
  /**
   * Splits raw CSV text into trimmed, non-empty tokens.
   *
   * @param text Raw file contents.
   * @returns Ordered list of policy number tokens (still raw strings; validation
   *          is a separate concern handled by the validator service).
   */
  parse(text: string): string[] {
    return text
      .split(/\r?\n/) // rows (tolerates both LF and CRLF line endings)
      .flatMap((row) => row.split(',')) // cells within each row
      .map((token) => token.trim())
      .filter((token) => token.length > 0);
  }
}
