import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../../src/handlers/lambda.js';
import type { APIGatewayProxyEvent } from 'aws-lambda';

global.fetch = vi.fn();

describe('lambda handler - integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return filtered RSS feed with keyword filter', async () => {
    const mockRssXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Test Feed</title>
          <description>Test Description</description>
          <item>
            <title>AI News Today</title>
            <description>Latest AI developments</description>
            <link>https://example.com/1</link>
          </item>
          <item>
            <title>Sports Update</title>
            <description>Weekend sports results</description>
            <link>https://example.com/2</link>
          </item>
        </channel>
      </rss>`;

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      text: async () => mockRssXml,
    });

    const event: Partial<APIGatewayProxyEvent> = {
      path: '/filter',
      queryStringParameters: {
        feedUrl: 'https://example.com/feed.xml',
        type: 'keyword',
        pattern: 'AI',
      },
    };

    const result = await handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200);
    expect(result.headers?.['Content-Type']).toBe('application/xml; charset=utf-8');
    expect(result.body).toContain('AI News Today');
    expect(result.body).not.toContain('Sports Update');
  });

  it('should return filtered RSS feed with regex filter', async () => {
    const mockRssXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Test Feed</title>
          <description>Test Description</description>
          <item>
            <title>[News] Breaking Story</title>
            <description>Important news</description>
            <link>https://example.com/1</link>
          </item>
          <item>
            <title>Regular Article</title>
            <description>Regular content</description>
            <link>https://example.com/2</link>
          </item>
        </channel>
      </rss>`;

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      text: async () => mockRssXml,
    });

    const event: Partial<APIGatewayProxyEvent> = {
      path: '/filter',
      queryStringParameters: {
        feedUrl: 'https://example.com/feed.xml',
        type: 'regex',
        pattern: '^\\[News\\]',
      },
    };

    const result = await handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200);
    expect(result.body).toContain('[News] Breaking Story');
    expect(result.body).not.toContain('Regular Article');
  });

  it('should return 400 for missing feedUrl', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      path: '/filter',
      queryStringParameters: {
        type: 'keyword',
        pattern: 'test',
      },
    };

    const result = await handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    expect(result.body).toContain('feedUrl');
  });

  it('should return 400 for invalid filter type', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      path: '/filter',
      queryStringParameters: {
        feedUrl: 'https://example.com/feed.xml',
        type: 'invalid',
        pattern: 'test',
      },
    };

    const result = await handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    expect(result.body).toContain('keyword');
  });

  it('should return 400 for invalid regex pattern', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      path: '/filter',
      queryStringParameters: {
        feedUrl: 'https://example.com/feed.xml',
        type: 'regex',
        pattern: '[invalid((',
      },
    };

    const result = await handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    expect(result.body).toContain('正規表現');
  });

  it('should return empty feed when no items match', async () => {
    const mockRssXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Test Feed</title>
          <description>Test Description</description>
          <item>
            <title>Test Item</title>
            <description>Test content</description>
            <link>https://example.com/1</link>
          </item>
        </channel>
      </rss>`;

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      text: async () => mockRssXml,
    });

    const event: Partial<APIGatewayProxyEvent> = {
      path: '/filter',
      queryStringParameters: {
        feedUrl: 'https://example.com/feed.xml',
        type: 'keyword',
        pattern: 'nonexistent',
      },
    };

    const result = await handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200);
    expect(result.body).toContain('<channel>');
    expect(result.body).not.toContain('<item>');
  });

  it('should switch between keyword and regex modes', async () => {
    const mockRssXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Test Feed</title>
          <description>Test Description</description>
          <item>
            <title>test.data.file</title>
            <description>Data file content</description>
            <link>https://example.com/1</link>
          </item>
        </channel>
      </rss>`;

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: async () => mockRssXml,
    });

    const keywordEvent: Partial<APIGatewayProxyEvent> = {
      path: '/filter',
      queryStringParameters: {
        feedUrl: 'https://example.com/feed.xml',
        type: 'keyword',
        pattern: 'test.*data',
      },
    };

    const keywordResult = await handler(keywordEvent as APIGatewayProxyEvent);
    expect(keywordResult.statusCode).toBe(200);
    expect(keywordResult.body).not.toContain('<item>');

    const regexEvent: Partial<APIGatewayProxyEvent> = {
      path: '/filter',
      queryStringParameters: {
        feedUrl: 'https://example.com/feed.xml',
        type: 'regex',
        pattern: 'test.*data',
      },
    };

    const regexResult = await handler(regexEvent as APIGatewayProxyEvent);
    expect(regexResult.statusCode).toBe(200);
    expect(regexResult.body).toContain('test.data.file');
  });
});
