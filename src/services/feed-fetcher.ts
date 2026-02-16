import { XMLParser } from 'fast-xml-parser';
import { FeedFetchError, ParseError } from '../lib/errors.js';
import type { RSSFeed, FeedItem } from '../models/feed.js';
import { decodeHtmlEntities } from './html-decoder.js';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  trimValues: true,
});

export async function fetchFeed(feedUrl: string): Promise<RSSFeed> {
  let response: Response;

  try {
    response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'RSS-Feed-Filter/1.0',
      },
    });
  } catch (error) {
    throw new FeedFetchError(
      feedUrl,
      undefined,
      `フィードの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!response.ok) {
    throw new FeedFetchError(
      feedUrl,
      response.status,
      `フィードの取得に失敗しました: HTTP ${response.status}`
    );
  }

  const xmlText = await response.text();

  try {
    const parsed = xmlParser.parse(xmlText) as Record<string, unknown>;
    return parseFeedData(parsed, feedUrl);
  } catch (error) {
    throw new ParseError(
      xmlText.substring(0, 200),
      `フィードの解析に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function parseFeedData(data: Record<string, unknown>, sourceUrl: string): RSSFeed {
  if ('rss' in data && typeof data.rss === 'object' && data.rss !== null) {
    return parseRSS(data.rss as Record<string, unknown>, sourceUrl);
  }

  if ('feed' in data && typeof data.feed === 'object' && data.feed !== null) {
    return parseAtom(data.feed as Record<string, unknown>, sourceUrl);
  }

  throw new ParseError('', 'RSS/Atomフィードが見つかりません');
}

function parseRSS(rss: Record<string, unknown>, sourceUrl: string): RSSFeed {
  const channel = rss.channel as Record<string, unknown>;

  if (!channel || typeof channel !== 'object') {
    throw new ParseError('', 'RSSチャンネルが見つかりません');
  }

  const title = String(channel.title || '');
  const description = String(channel.description || '');
  const link = channel.link ? String(channel.link) : undefined;
  const lastBuildDate = channel.lastBuildDate ? String(channel.lastBuildDate) : undefined;

  let items: FeedItem[] = [];
  if (channel.item) {
    const itemsArray = Array.isArray(channel.item) ? channel.item : [channel.item];
    items = itemsArray.map((item) => parseRSSItem(item as Record<string, unknown>));
  }

  return {
    title: decodeHtmlEntities(title),
    description: decodeHtmlEntities(description),
    sourceUrl,
    link,
    lastBuildDate,
    items,
  };
}

function parseRSSItem(item: Record<string, unknown>): FeedItem {
  const title = String(item.title || '');
  const description = String(item.description || '');
  const link = String(item.link || '');
  const pubDate = item.pubDate ? String(item.pubDate) : undefined;
  const author = item.author ? String(item.author) : undefined;
  const guid = item.guid ? String(item.guid) : undefined;

  let categories: string[] | undefined;
  if (item.category) {
    const catArray = Array.isArray(item.category) ? item.category : [item.category];
    categories = catArray.map((cat) => String(cat));
  }

  return {
    title: decodeHtmlEntities(stripHtmlTags(title)),
    description: decodeHtmlEntities(stripHtmlTags(description)),
    link,
    pubDate,
    author,
    categories,
    guid,
  };
}

function parseAtom(feed: Record<string, unknown>, sourceUrl: string): RSSFeed {
  const title = String(feed.title || '');
  const subtitle = String(feed.subtitle || '');
  const updated = feed.updated ? String(feed.updated) : undefined;

  let link: string | undefined;
  if (feed.link) {
    const linkArray = Array.isArray(feed.link) ? feed.link : [feed.link];
    const htmlLink = linkArray.find(
      (l) =>
        typeof l === 'object' &&
        l !== null &&
        '@_rel' in l &&
        (l as Record<string, unknown>)['@_rel'] === 'alternate'
    ) as Record<string, unknown> | undefined;
    if (htmlLink && typeof htmlLink === 'object' && '@_href' in htmlLink) {
      link = String(htmlLink['@_href']);
    }
  }

  let items: FeedItem[] = [];
  if (feed.entry) {
    const entryArray = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
    items = entryArray.map((entry) => parseAtomEntry(entry as Record<string, unknown>));
  }

  return {
    title: decodeHtmlEntities(title),
    description: decodeHtmlEntities(subtitle),
    sourceUrl,
    link,
    lastBuildDate: updated,
    items,
  };
}

function parseAtomEntry(entry: Record<string, unknown>): FeedItem {
  const title = String(entry.title || '');
  const summary = String(entry.summary || '');
  const updated = entry.updated ? String(entry.updated) : undefined;

  let link = '';
  if (entry.link) {
    const linkArray = Array.isArray(entry.link) ? entry.link : [entry.link];
    const htmlLink = linkArray.find(
      (l) =>
        typeof l === 'object' &&
        l !== null &&
        '@_rel' in l &&
        (l as Record<string, unknown>)['@_rel'] === 'alternate'
    ) as Record<string, unknown> | undefined;
    if (htmlLink && typeof htmlLink === 'object' && '@_href' in htmlLink) {
      link = String(htmlLink['@_href']);
    }
  }

  let author: string | undefined;
  if (entry.author && typeof entry.author === 'object') {
    const authorObj = entry.author as Record<string, unknown>;
    author = authorObj.name ? String(authorObj.name) : undefined;
  }

  let categories: string[] | undefined;
  if (entry.category) {
    const catArray = Array.isArray(entry.category) ? entry.category : [entry.category];
    categories = catArray.map((cat) =>
      typeof cat === 'object' && cat !== null && '@_term' in cat
        ? String((cat as Record<string, unknown>)['@_term'])
        : String(cat)
    );
  }

  const guid = entry.id ? String(entry.id) : undefined;

  return {
    title: decodeHtmlEntities(stripHtmlTags(title)),
    description: decodeHtmlEntities(stripHtmlTags(summary)),
    link,
    pubDate: updated,
    author,
    categories,
    guid,
  };
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
