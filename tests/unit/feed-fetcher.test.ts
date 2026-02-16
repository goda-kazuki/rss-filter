import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchFeed } from '../../src/services/feed-fetcher.js';
import { FeedFetchError, ParseError } from '../../src/lib/errors.js';

global.fetch = vi.fn();

describe('feed-fetcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and parse RSS 2.0 feed', async () => {
    const mockRssXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Test Feed</title>
          <description>Test Description</description>
          <link>https://example.com</link>
          <item>
            <title>Test Item</title>
            <description>Item Description</description>
            <link>https://example.com/item1</link>
            <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>`;

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => mockRssXml,
    });

    const feed = await fetchFeed('https://example.com/feed.xml');

    expect(feed.title).toBe('Test Feed');
    expect(feed.description).toBe('Test Description');
    expect(feed.link).toBe('https://example.com');
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].title).toBe('Test Item');
    expect(feed.items[0].description).toBe('Item Description');
  });

  it('should decode HTML entities in feed content', async () => {
    const mockRssXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Test &amp; Demo</title>
          <description>News &lt;tag&gt; &quot;quotes&quot;</description>
          <item>
            <title>Item &amp; Test</title>
            <description>&lt;p&gt;Content&lt;/p&gt;</description>
            <link>https://example.com/item1</link>
          </item>
        </channel>
      </rss>`;

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      text: async () => mockRssXml,
    });

    const feed = await fetchFeed('https://example.com/feed.xml');

    expect(feed.title).toBe('Test & Demo');
    expect(feed.description).toBe('News <tag> "quotes"');
    expect(feed.items[0].title).toBe('Item & Test');
    expect(feed.items[0].description).toBe('Content');
  });

  it('should throw FeedFetchError on network failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    );

    await expect(fetchFeed('https://example.com/feed.xml')).rejects.toThrow(FeedFetchError);
  });

  it('should throw FeedFetchError on HTTP error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    });

    await expect(fetchFeed('https://example.com/feed.xml')).rejects.toThrow(FeedFetchError);
  });

  it('should throw ParseError on invalid XML', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      text: async () => 'Invalid XML',
    });

    await expect(fetchFeed('https://example.com/feed.xml')).rejects.toThrow(ParseError);
  });

  it('should parse Atom feed', async () => {
    const mockAtomXml = `<?xml version="1.0" encoding="UTF-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Atom Feed</title>
        <subtitle>Atom Description</subtitle>
        <link rel="alternate" href="https://example.com"/>
        <entry>
          <title>Atom Item</title>
          <summary>Atom Summary</summary>
          <link rel="alternate" href="https://example.com/item1"/>
          <updated>2024-01-01T00:00:00Z</updated>
        </entry>
      </feed>`;

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      text: async () => mockAtomXml,
    });

    const feed = await fetchFeed('https://example.com/feed.xml');

    expect(feed.title).toBe('Atom Feed');
    expect(feed.description).toBe('Atom Description');
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0].title).toBe('Atom Item');
  });
});
