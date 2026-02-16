import { describe, it, expect } from 'vitest';
import { applyKeywordFilter, applyRegexFilter, applyFilter } from '../../src/services/feed-filter.js';
import { RegexTimeoutError } from '../../src/lib/errors.js';
import type { FeedItem } from '../../src/models/feed.js';

const mockItems: FeedItem[] = [
  {
    title: 'Breaking News: AI Breakthrough',
    description: 'Scientists announce major AI advancement',
    link: 'https://example.com/1',
  },
  {
    title: 'Technology Update',
    description: 'Latest tech news and updates',
    link: 'https://example.com/2',
  },
  {
    title: 'Sports Highlights',
    description: 'Weekend sports results',
    link: 'https://example.com/3',
  },
];

describe('feed-filter - keyword', () => {
  it('should filter items by keyword (case-insensitive)', () => {
    const result = applyKeywordFilter(mockItems, 'AI');
    expect(result).toHaveLength(1);
    expect(result[0].title).toContain('AI');
  });

  it('should match keyword in title', () => {
    const result = applyKeywordFilter(mockItems, 'breaking');
    expect(result).toHaveLength(1);
    expect(result[0].title).toContain('Breaking');
  });

  it('should match keyword in description', () => {
    const result = applyKeywordFilter(mockItems, 'scientists');
    expect(result).toHaveLength(1);
    expect(result[0].description).toContain('Scientists');
  });

  it('should be case-insensitive', () => {
    const result1 = applyKeywordFilter(mockItems, 'news');
    const result2 = applyKeywordFilter(mockItems, 'NEWS');
    const result3 = applyKeywordFilter(mockItems, 'NeWs');

    expect(result1).toHaveLength(2);
    expect(result2).toHaveLength(2);
    expect(result3).toHaveLength(2);
  });

  it('should return empty array when no matches', () => {
    const result = applyKeywordFilter(mockItems, 'nonexistent');
    expect(result).toHaveLength(0);
  });
});

describe('feed-filter - regex', () => {
  it('should filter items by regex pattern', () => {
    const result = applyRegexFilter(mockItems, '^Breaking');
    expect(result).toHaveLength(1);
    expect(result[0].title).toMatch(/^Breaking/);
  });

  it('should support complex regex patterns', () => {
    const result = applyRegexFilter(mockItems, 'AI|Technology');
    expect(result).toHaveLength(2);
  });

  it('should be case-insensitive by default', () => {
    const result = applyRegexFilter(mockItems, 'breaking');
    expect(result).toHaveLength(1);
  });

  it('should match pattern in combined text', () => {
    const result = applyRegexFilter(mockItems, 'sports.*results');
    expect(result).toHaveLength(1);
  });

  it('should return empty array when no matches', () => {
    const result = applyRegexFilter(mockItems, '^Nonexistent$');
    expect(result).toHaveLength(0);
  });
});

describe('feed-filter - unified', () => {
  it('should apply keyword filter when type is keyword', () => {
    const result = applyFilter(mockItems, { type: 'keyword', pattern: 'AI' });
    expect(result).toHaveLength(1);
  });

  it('should apply regex filter when type is regex', () => {
    const result = applyFilter(mockItems, { type: 'regex', pattern: '^Breaking' });
    expect(result).toHaveLength(1);
  });
});
