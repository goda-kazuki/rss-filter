import { describe, it, expect } from 'vitest';
import { decodeHtmlEntities } from '../../src/services/html-decoder.js';

describe('html-decoder', () => {
  it('should decode common HTML entities', () => {
    expect(decodeHtmlEntities('&lt;')).toBe('<');
    expect(decodeHtmlEntities('&gt;')).toBe('>');
    expect(decodeHtmlEntities('&amp;')).toBe('&');
    expect(decodeHtmlEntities('&quot;')).toBe('"');
    expect(decodeHtmlEntities('&apos;')).toBe("'");
  });

  it('should decode multiple entities in a string', () => {
    const input = 'Test &amp; Demo &lt;tag&gt; &quot;quotes&quot;';
    const expected = 'Test & Demo <tag> "quotes"';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  it('should handle numeric character references', () => {
    expect(decodeHtmlEntities('&#60;')).toBe('<');
    expect(decodeHtmlEntities('&#x3C;')).toBe('<');
  });

  it('should return unchanged string when no entities', () => {
    const input = 'Plain text with no entities';
    expect(decodeHtmlEntities(input)).toBe(input);
  });

  it('should decode Japanese characters', () => {
    expect(decodeHtmlEntities('&#12486;&#12473;&#12488;')).toBe('テスト');
  });
});
