export interface RSSFeed {
  title: string;
  description: string;
  sourceUrl: string;
  link?: string;
  lastBuildDate?: string;
  items: FeedItem[];
}

export interface FeedItem {
  title: string;
  description: string;
  link: string;
  pubDate?: string;
  author?: string;
  categories?: string[];
  guid?: string;
}
