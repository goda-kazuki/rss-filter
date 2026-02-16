import type { FeedItem } from './feed.js';

export type FilterCriteria = KeywordFilter | RegexFilter;

export interface KeywordFilter {
  type: 'keyword';
  pattern: string;
}

export interface RegexFilter {
  type: 'regex';
  pattern: string;
}

export interface FilterResult {
  items: FeedItem[];
  matchCount: number;
  totalCount: number;
  filterApplied: FilterCriteria;
  feed: {
    title: string;
    description: string;
    link?: string;
  };
}
