import type { FeedItem } from '../models/feed.js';
import type { FilterCriteria } from '../models/filter.js';
import { RegexTimeoutError } from '../lib/errors.js';

export function applyKeywordFilter(items: FeedItem[], pattern: string): FeedItem[] {
  const lowerPattern = pattern.toLowerCase();

  return items.filter((item) => {
    const titleLower = item.title.toLowerCase();
    const descLower = item.description.toLowerCase();

    return titleLower.includes(lowerPattern) || descLower.includes(lowerPattern);
  });
}

export function applyRegexFilter(items: FeedItem[], pattern: string): FeedItem[] {
  const regex = new RegExp(pattern, 'i');
  const timeoutMs = 2000;

  return items.filter((item) => {
    const combinedText = `${item.title} ${item.description}`;

    const startTime = Date.now();
    try {
      const result = regex.test(combinedText);
      const elapsed = Date.now() - startTime;

      if (elapsed > timeoutMs) {
        throw new RegexTimeoutError(pattern);
      }

      return result;
    } catch (error) {
      if (error instanceof RegexTimeoutError) {
        throw error;
      }
      const elapsed = Date.now() - startTime;
      if (elapsed > timeoutMs) {
        throw new RegexTimeoutError(pattern);
      }
      throw error;
    }
  });
}

export function applyFilter(items: FeedItem[], criteria: FilterCriteria): FeedItem[] {
  if (criteria.type === 'keyword') {
    return applyKeywordFilter(items, criteria.pattern);
  }

  if (criteria.type === 'regex') {
    return applyRegexFilter(items, criteria.pattern);
  }

  return items;
}
