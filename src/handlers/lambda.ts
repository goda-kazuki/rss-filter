import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { fetchFeed } from '../services/feed-fetcher.js';
import { applyFilter } from '../services/feed-filter.js';
import { FeedFetchError, ParseError, FilterValidationError, RegexTimeoutError } from '../lib/errors.js';
import type { FilterCriteria } from '../models/filter.js';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.info('Lambda handler invoked', { 
    path: event.path ?? 'unknown', 
    queryStringParameters: event.queryStringParameters ?? null
  });

  const startTime = Date.now();

  try {
    const params = validateQueryParams(event.queryStringParameters ?? null);

    const feed = await fetchFeed(params.feedUrl);
    console.info('Feed fetched', { itemCount: feed.items.length, feedUrl: params.feedUrl });

    const filterCriteria: FilterCriteria = {
      type: params.type,
      pattern: params.pattern,
    };

    const filteredItems = applyFilter(feed.items, filterCriteria);
    const elapsedTime = Date.now() - startTime;

    console.info('Filter applied', {
      type: params.type,
      pattern: params.pattern,
      totalItems: feed.items.length,
      matchedItems: filteredItems.length,
      elapsedMs: elapsedTime,
    });

    const rssXml = generateRSSXML(feed.title, feed.description, feed.link, filteredItems);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
      body: rssXml,
    };
  } catch (error) {
    return handleError(error);
  }
}

function validateQueryParams(params: Record<string, string> | null): {
  feedUrl: string;
  type: 'keyword' | 'regex';
  pattern: string;
} {
  if (!params) {
    throw new FilterValidationError('', 'クエリパラメータが必要です');
  }

  const feedUrl = params.feedUrl;
  if (!feedUrl || feedUrl.trim() === '') {
    throw new FilterValidationError('', 'feedUrlパラメータが必要です');
  }

  if (!feedUrl.startsWith('http://') && !feedUrl.startsWith('https://')) {
    throw new FilterValidationError(feedUrl, '無効なフィードURLです');
  }

  const type = params.type;
  if (!type || (type !== 'keyword' && type !== 'regex')) {
    throw new FilterValidationError(type || '', 'typeパラメータは "keyword" または "regex" である必要があります');
  }

  const pattern = params.pattern;
  if (!pattern || pattern.trim() === '') {
    throw new FilterValidationError('', 'patternパラメータが必要です');
  }

  if (type === 'regex') {
    try {
      new RegExp(pattern);
    } catch (error) {
      throw new FilterValidationError(pattern, `無効な正規表現パターンです: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    feedUrl,
    type,
    pattern,
  };
}

function handleError(error: unknown): APIGatewayProxyResult {
  console.error('Error occurred:', error);

  if (error instanceof FilterValidationError) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: error.message,
    };
  }

  if (error instanceof FeedFetchError) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: error.message,
    };
  }

  if (error instanceof ParseError) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: error.message,
    };
  }

  if (error instanceof RegexTimeoutError) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: error.message,
    };
  }

  return {
    statusCode: 500,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body: 'Internal Server Error',
  };
}

function generateRSSXML(title: string, description: string, link: string | undefined, items: Array<{
  title: string;
  description: string;
  link: string;
  pubDate?: string;
  author?: string;
  guid?: string;
}>): string {
  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss version="2.0">\n';
  xml += '  <channel>\n';
  xml += `    <title>${escapeXml(title)}</title>\n`;
  xml += `    <description>${escapeXml(description)}</description>\n`;
  if (link) {
    xml += `    <link>${escapeXml(link)}</link>\n`;
  }

  for (const item of items) {
    xml += '    <item>\n';
    xml += `      <title>${escapeXml(item.title)}</title>\n`;
    xml += `      <description>${escapeXml(item.description)}</description>\n`;
    xml += `      <link>${escapeXml(item.link)}</link>\n`;
    if (item.pubDate) {
      xml += `      <pubDate>${escapeXml(item.pubDate)}</pubDate>\n`;
    }
    if (item.author) {
      xml += `      <author>${escapeXml(item.author)}</author>\n`;
    }
    if (item.guid) {
      xml += `      <guid>${escapeXml(item.guid)}</guid>\n`;
    }
    xml += '    </item>\n';
  }

  xml += '  </channel>\n';
  xml += '</rss>';

  return xml;
}
