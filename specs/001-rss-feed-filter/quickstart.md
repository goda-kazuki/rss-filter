# Quickstart Guide: RSS Feed Filter API

**Version**: 1.0.0  
**Last Updated**: 2026-02-16

## Overview

RSS Feed Filter APIは、RSSフィードからキーワードまたは正規表現でアイテムをフィルタリングするサーバーレスAPIです。

**Key Features**:
- ✅ キーワード検索 (大文字小文字区別可能)
- ✅ 正規表現フィルタリング
- ✅ RSS 2.0 & Atom対応
- ✅ HTMLエンティティ自動デコード
- ✅ 5000件までのフィードサポート

---

## Quick Start

### 1. API Endpoint

```
POST https://{your-lambda-url}.lambda-url.us-east-1.on.aws/filter
```

### 2. Basic Request (Keyword Filter)

```bash
curl -X POST https://{your-lambda-url}.lambda-url.us-east-1.on.aws/filter \
  -H "Content-Type: application/json" \
  -d '{
    "feedUrl": "https://example.com/feed.xml",
    "filter": {
      "type": "keyword",
      "pattern": "technology",
      "caseSensitive": false
    }
  }'
```

### 3. Response Example

```json
{
  "feed": {
    "title": "Tech News",
    "description": "Latest technology news"
  },
  "items": [
    {
      "title": "New Technology Breakthrough",
      "description": "Scientists announce...",
      "link": "https://example.com/article1",
      "pubDate": "2026-02-15T10:00:00Z"
    }
  ],
  "matchCount": 1,
  "totalCount": 20,
  "filterApplied": {
    "type": "keyword",
    "pattern": "technology",
    "caseSensitive": false
  }
}
```

---

## Usage Examples

### Example 1: Case-Sensitive Keyword Search

```bash
curl -X POST {API_ENDPOINT}/filter \
  -H "Content-Type: application/json" \
  -d '{
    "feedUrl": "https://news.example.com/rss",
    "filter": {
      "type": "keyword",
      "pattern": "AI",
      "caseSensitive": true
    }
  }'
```

**Result**: "AI"にマッチ、"ai"や"Ai"はマッチしない

---

### Example 2: Regex Filter (Breaking News)

```bash
curl -X POST {API_ENDPOINT}/filter \
  -H "Content-Type: application/json" \
  -d '{
    "feedUrl": "https://news.example.com/rss",
    "filter": {
      "type": "regex",
      "pattern": "^Breaking:"
    }
  }'
```

**Result**: "Breaking:"で始まるタイトルのみ表示

---

### Example 3: Date Pattern Filter

```bash
curl -X POST {API_ENDPOINT}/filter \
  -H "Content-Type: application/json" \
  -d '{
    "feedUrl": "https://blog.example.com/feed",
    "filter": {
      "type": "regex",
      "pattern": "\\d{4}-\\d{2}-\\d{2}"
    }
  }'
```

**Result**: YYYY-MM-DD形式の日付を含むアイテムを抽出

---

### Example 4: Bug Tracker References

```bash
curl -X POST {API_ENDPOINT}/filter \
  -H "Content-Type: application/json" \
  -d '{
    "feedUrl": "https://commits.example.com/feed",
    "filter": {
      "type": "regex",
      "pattern": "bug-\\d+"
    }
  }'
```

**Result**: "bug-123", "bug-456"のようなバグIDを含むアイテムを抽出

---

## Error Handling

### Client Errors (400)

#### Invalid Regular Expression

```json
{
  "error": {
    "code": "INVALID_REGEX",
    "message": "無効な正規表現パターンです",
    "details": "Unterminated character class"
  }
}
```

**Solution**: 正規表現構文を確認してください。

#### Invalid URL

```json
{
  "error": {
    "code": "INVALID_URL",
    "message": "無効なフィードURLです"
  }
}
```

**Solution**: `http://` または `https://` で始まる有効なURLを指定してください。

---

### Server Errors (500)

#### Feed Fetch Error

```json
{
  "error": {
    "code": "FEED_FETCH_ERROR",
    "message": "フィードの取得に失敗しました",
    "details": "HTTP 404: Not Found"
  }
}
```

**Solution**: フィードURLが正しいか、アクセス可能か確認してください。

#### Parse Error

```json
{
  "error": {
    "code": "PARSE_ERROR",
    "message": "フィードの解析に失敗しました",
    "details": "Invalid XML format"
  }
}
```

**Solution**: フィードが有効なRSS 2.0またはAtom形式か確認してください。

---

## Performance Guidelines

| フィードサイズ | 推奨 | 最大 |
|---------------|------|------|
| アイテム数 | 100-1000件 | 5000件 |
| レスポンス時間 | <2秒 | <5秒 |
| 正規表現複雑性 | シンプルなパターン | 500msタイムアウト |

---

## Development Setup

### Prerequisites

- Node.js 20.x LTS
- AWS Lambda Function URL
- `curl` or any HTTP client

### Test with Sample Feed

```bash
# 公開RSSフィードでテスト
curl -X POST {API_ENDPOINT}/filter \
  -H "Content-Type: application/json" \
  -d '{
    "feedUrl": "https://www.reddit.com/r/technology/.rss",
    "filter": {
      "type": "keyword",
      "pattern": "AI",
      "caseSensitive": false
    }
  }'
```

---

## JavaScript/TypeScript Client

### Installation

```bash
npm install axios
```

### Example Code

```typescript
import axios from 'axios';

interface FilterRequest {
  feedUrl: string;
  filter: {
    type: 'keyword' | 'regex';
    pattern: string;
    caseSensitive?: boolean;
  };
}

async function filterFeed(request: FilterRequest) {
  try {
    const response = await axios.post(
      'https://{your-lambda-url}.lambda-url.us-east-1.on.aws/filter',
      request,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log(`Matched ${response.data.matchCount} of ${response.data.totalCount} items`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data.error);
    }
    throw error;
  }
}

// Usage
filterFeed({
  feedUrl: 'https://example.com/feed.xml',
  filter: {
    type: 'keyword',
    pattern: 'technology',
    caseSensitive: false
  }
});
```

---

## Python Client

### Installation

```bash
pip install requests
```

### Example Code

```python
import requests

def filter_feed(feed_url: str, filter_type: str, pattern: str, case_sensitive: bool = False):
    endpoint = "https://{your-lambda-url}.lambda-url.us-east-1.on.aws/filter"
    
    payload = {
        "feedUrl": feed_url,
        "filter": {
            "type": filter_type,
            "pattern": pattern
        }
    }
    
    if filter_type == "keyword":
        payload["filter"]["caseSensitive"] = case_sensitive
    
    response = requests.post(endpoint, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Matched {data['matchCount']} of {data['totalCount']} items")
        return data
    else:
        error = response.json()["error"]
        print(f"Error {error['code']}: {error['message']}")
        return None

# Usage
result = filter_feed(
    feed_url="https://example.com/feed.xml",
    filter_type="keyword",
    pattern="technology",
    case_sensitive=False
)
```

---

## Common Use Cases

### 1. Personal News Aggregator

特定のトピックに関するニュースのみを購読:

```bash
# "climate"に関する記事のみ
filter: { type: "keyword", pattern: "climate", caseSensitive: false }
```

### 2. Developer Commit Feed

特定のバグ修正コミットを追跡:

```bash
# "fix:"で始まるコミットメッセージ
filter: { type: "regex", pattern: "^fix:" }
```

### 3. Security Alerts

セキュリティ関連の更新のみ抽出:

```bash
# "security", "vulnerability", "CVE"を含むアイテム
filter: { type: "regex", pattern: "security|vulnerability|CVE-\\d+" }
```

### 4. Blog Post Categories

特定のカテゴリの投稿のみ表示:

```bash
# "[Tutorial]"タグ付き記事
filter: { type: "regex", pattern: "\\[Tutorial\\]" }
```

---

## Best Practices

### 1. Pattern Design

- **キーワード**: 短い単語またはフレーズを使用
- **正規表現**: シンプルなパターンを優先、複雑すぎると500msでタイムアウト

### 2. Error Recovery

```javascript
async function robustFilterFeed(request) {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await filterFeed(request);
    } catch (error) {
      if (error.response?.data.error.code === 'FEED_FETCH_ERROR') {
        // ネットワークエラー: リトライ
        await sleep(1000 * (i + 1));
        continue;
      }
      // その他のエラー: 即座に失敗
      throw error;
    }
  }
}
```

### 3. Caching Strategy

フィードURLとフィルタパターンをキーとしてクライアント側でキャッシュ:

```javascript
const cacheKey = `${feedUrl}:${JSON.stringify(filter)}`;
const cached = cache.get(cacheKey);
if (cached && Date.now() - cached.timestamp < 300000) { // 5分
  return cached.data;
}
```

---

## Troubleshooting

### Issue: "REGEX_TIMEOUT" Error

**Cause**: 正規表現が複雑すぎる  
**Solution**: パターンを簡略化する

```bash
# ❌ 複雑すぎる
"(a+)+b"

# ✅ シンプル
"a+b"
```

### Issue: Empty Results (`matchCount: 0`)

**Cause**: パターンがマッチしない  
**Solution**: 
1. キーワードの大文字小文字を確認
2. `caseSensitive: false` を試す
3. より広いパターンを使用

### Issue: Slow Response

**Cause**: フィードサイズが大きい  
**Solution**:
1. より具体的なフィルタで結果を絞る
2. フィードソースで事前フィルタリング
3. 5000件未満のフィードを使用

---

## Next Steps

1. **契約テスト**: `/specs/001-rss-feed-filter/contracts/openapi.yaml` 参照
2. **データモデル**: `/specs/001-rss-feed-filter/data-model.md` 参照
3. **実装タスク**: `specs/001-rss-feed-filter/tasks.md` (Phase 2で生成)

---

## Support

- **Issue Tracker**: [GitHub Issues]
- **Documentation**: `/specs/001-rss-feed-filter/`
- **API Contract**: `contracts/openapi.yaml`

---

**Version**: 1.0.0 | **License**: [Your License] | **Author**: RSS Filter Service Team
