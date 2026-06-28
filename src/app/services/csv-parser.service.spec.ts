import { TestBed } from '@angular/core/testing';
import { CsvParserService } from './csv-parser.service';

describe('CsvParserService', () => {
  let service: CsvParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CsvParserService);
  });

  it('parses a single comma-separated line (the scanner sample format)', () => {
    expect(service.parse('457508000,123456789,664371495')).toEqual([
      '457508000',
      '123456789',
      '664371495',
    ]);
  });

  it('parses a one-value-per-line export', () => {
    expect(service.parse('457508000\n123456789\n664371495')).toEqual([
      '457508000',
      '123456789',
      '664371495',
    ]);
  });

  it('parses a mix of commas and newlines', () => {
    expect(service.parse('1,2\n3,4')).toEqual(['1', '2', '3', '4']);
  });

  it('tolerates CRLF line endings', () => {
    expect(service.parse('1,2\r\n3')).toEqual(['1', '2', '3']);
  });

  it('trims surrounding whitespace around tokens', () => {
    expect(service.parse('  457508000 , 123456789  ')).toEqual([
      '457508000',
      '123456789',
    ]);
  });

  it('drops empty tokens from trailing commas and blank lines', () => {
    expect(service.parse('1,2,\n\n3,')).toEqual(['1', '2', '3']);
  });

  it('returns an empty array for empty or whitespace-only input', () => {
    expect(service.parse('')).toEqual([]);
    expect(service.parse('   \n  \n')).toEqual([]);
  });

  it('preserves duplicates (de-duping is not the parser’s job)', () => {
    expect(service.parse('861100036,861100036')).toEqual([
      '861100036',
      '861100036',
    ]);
  });

  it('parses the full provided sample.csv line into 10 tokens', () => {
    const sample =
      '457500000,664371495,333333333,457508000,555555555,666666666,777777777,861100036,861100036,123456789';
    const tokens = service.parse(sample);
    expect(tokens).toHaveLength(10);
    expect(tokens[3]).toBe('457508000');
    expect(tokens.at(-1)).toBe('123456789');
  });
});
