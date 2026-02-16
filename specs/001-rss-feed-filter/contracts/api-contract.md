# API Contract: RSS Feed Filter

**Version**: 1.0.0  
**Protocol**: REST (JSON)  
**Date**: 2026-02-16

## Overview

このAPIは単一エンドポイント`POST /filter`を提供し、RSSフィードのフィルタリング機能を実現します。

---

## Endpoint: POST /filter

### Request

#### Headers

```http
Content-Type: application/json
```

#### Body Schema

```typescript
interface FilterRequest {
  feedUrl: string; // RSSフィードURL (RSS 2.0/Atom)
  filter: FilterCriteria; // フィルタ基準
}

type FilterCriteria = KeywordFilter | RegexFilter;

interface KeywordFilter {
  type: 'keyword';
  pattern: string; // キーワード (非空)
  caseSensitive: boolean; // 大文字小文字区別
}

interface RegexFilter {
  type: 'regex';
  pattern: string; // 正規表現パターン (非空)
}
```

#### Example: Keyword Filter

```json
{
  "feedUrl": "https://example.com/feed.xml",
  "filter": {
    "type": "keyword",
    "pattern": "テクノロジー",
    "caseSensitive": false
  }
}
```

#### Example: Regex Filter

```json
{
  "feedUrl": "https://example.com/feed.xml",
  "filter": {
    "type": "regex",
    "pattern": "^Breaking:"
  }
}
```

---

### Response: Success (200 OK)

#### Body Schema

```typescript
interface FilterResponse {
  feed: FeedMetadata;
  items: FeedItem[];
  matchCount: number; // マッチしたアイテム数
  totalCount: number; // 総アイテム数
  filterApplied: FilterCriteria; // 適用されたフィルタ
}

interface FeedMetadata {
  title: string;
  description: string;
  link?: string;
}

interface FeedItem {
  title: string;
  description: string; // HTMLデコード済み
  link: string;
  pubDate?: string; // ISO 8601
  author?: string;
  categories?: string[];
  guid?: string;
}
```

#### Example

```json
{
  "feed": {
    "title": "Tech News",
    "description": "Latest technology news",
    "link": "https://example.com"
  },
  "items": [
    {
      "title": "Breaking: New AI Model Released",
      "description": "A groundbreaking AI model has been announced...",
      "link": "https://example.com/article1",
      "pubDate": "2026-02-15T10:00:00Z",
      "author": "John Doe",
      "categories": ["Technology", "AI"]
    }
  ],
  "matchCount": 1,
  "totalCount": 20,
  "filterApplied": {
    "type": "regex",
    "pattern": "^Breaking:"
  }
}
```

---

### Response: Client Error (400 Bad Request)

#### Error Codes

- `INVALID_URL`: 無効なフィードURL
- `INVALID_REGEX`: 正規表現の構文エラー
- `INVALID_FILTER`: フィルタ基準の検証失敗

#### Body Schema

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string; // ユーザー向けメッセージ
    details?: unknown; // デバッグ情報
  };
}
```

#### Example

```json
{
  "error": {
    "code": "INVALID_REGEX",
    "message": "無効な正規表現パターンです",
    "details": "Unterminated character class at position 5"
  }
}
```

---

### Response: Server Error (500 Internal Server Error)

#### Error Codes

- `FEED_FETCH_ERROR`: フィード取得失敗
- `PARSE_ERROR`: フィード解析失敗
- `REGEX_TIMEOUT`: 正規表現タイムアウト

#### Example

```json
{
  "error": {
    "code": "FEED_FETCH_ERROR",
    "message": "フィードの取得に失敗しました",
    "details": "HTTP 404: Not Found"
  }
}
```

---

## Validation Rules

### Request Validation

| フィールド | ルール | エラーメッセージ |
|-----------|--------|-----------------|
| `feedUrl` | 非空、http/https形式 | "無効なフィードURLです" |
| `filter.type` | 'keyword' or 'regex' | "無効なフィルタタイプです" |
| `filter.pattern` | 非空文字列 | "フィルタパターンが空です" |
| `filter.caseSensitive` (keyword) | boolean | "caseSensitiveはboolean型である必要があります" |

### Response Guarantees

- `matchCount ≤ totalCount`
- `items.length === matchCount`
- `items` の順序は元のフィードと同じ
- `description` はHTMLエンティティデコード済み

---

## Performance Expectations

| シナリオ | 期待値 |
|---------|--------|
| 1000件フィード | 2秒以内 |
| 5000件フィード | 5秒以内 |
| 正規表現実行 | 500msタイムアウト |

---

## Edge Cases

1. **空のフィルタパターン**: 400エラー
2. **マッチなし**: `matchCount: 0`, `items: []`
3. **全アイテムマッチ**: `matchCount === totalCount`
4. **フィードアイテムなし**: `matchCount: 0`, `totalCount: 0`
5. **不正なXML**: 500エラー (PARSE_ERROR)
6. **ネットワークエラー**: 500エラー (FEED_FETCH_ERROR)
7. **複雑すぎる正規表現**: 500エラー (REGEX_TIMEOUT)

---

## CORS Policy

AWS Lambda Function URLのデフォルト設定に従います。

```yaml
AllowOrigins: ["*"]
AllowMethods: ["POST"]
AllowHeaders: ["Content-Type"]
```

---

## Authentication

Phase 1では認証なし。将来的にAPI KeyまたはJWT認証を追加可能。

---

## Rate Limiting

Lambda同時実行数による自然な制限 (デフォルト: 1000並列実行)。

---

## Versioning Strategy

URLパス `/v1/filter` を使用する将来的なバージョニングに対応可能。現在は `/filter` で固定。

---

## Testing Contract

### Test Cases

1. **正常系 - キーワードフィルタ**
   - 入力: 有効なRSS URL + keyword filter
   - 期待: 200 OK + フィルタリング結果

2. **正常系 - 正規表現フィルタ**
   - 入力: 有効なRSS URL + regex filter
   - 期待: 200 OK + フィルタリング結果

3. **異常系 - 無効なURL**
   - 入力: 不正なURL
   - 期待: 400 Bad Request + INVALID_URL

4. **異常系 - 無効な正規表現**
   - 入力: `[unclosed`
   - 期待: 400 Bad Request + INVALID_REGEX

5. **異常系 - フィード取得失敗**
   - 入力: 存在しないURL
   - 期待: 500 Internal Server Error + FEED_FETCH_ERROR

6. **エッジケース - マッチなし**
   - 入力: マッチしないパターン
   - 期待: 200 OK + `matchCount: 0`

---

## Summary

このAPIコントラクトは以下を保証します:

- **明確な責任境界**: クライアント(400)とサーバー(500)のエラーを分離
- **型安全性**: TypeScript型定義で正確な仕様表現
- **拡張性**: 将来的なフィルタタイプ追加に対応
- **パフォーマンス保証**: 5000件フィードで5秒以内
- **エラーハンドリング**: すべてのエラーケースを文書化
