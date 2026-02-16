# Quickstart Guide: RSS Feed Filter API

**Version**: 1.0.0  
**Last Updated**: 2026-02-16

## Overview

RSS Feed Filter APIは、RSSフィードからキーワードまたは正規表現でアイテムをフィルタリングするサーバーレスAPIです。レスポンスはRSS/Atom XML形式で、既存のRSSリーダーで直接利用可能です。

**Key Features**:
- ✅ キーワード検索（常に大文字小文字を区別しない）
- ✅ 正規表現フィルタリング
- ✅ RSS 2.0 & Atom対応
- ✅ HTMLエンティティ自動デコード
- ✅ 5000件までのフィードサポート
- ✅ RSSリーダー互換のXMLレスポンス

---

## Quick Start

### 1. API Endpoint

```
GET https://{your-lambda-url}.lambda-url.ap-northeast-1.on.aws/filter
```

### 2. Basic Request (Keyword Filter)

```bash
curl "https://{your-lambda-url}.lambda-url.ap-northeast-1.on.aws/filter?feedUrl=https://example.com/feed.xml&type=keyword&pattern=technology"
```

### 3. Response Example (RSS 2.0)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Tech News</title>
    <description>Latest technology news</description>
    <link>https://example.com</link>
    <item>
      <title>New Technology Breakthrough</title>
      <description>Scientists announce...</description>
      <link>https://example.com/article1</link>
      <pubDate>Sat, 15 Feb 2026 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>
```

---

## Usage Examples

### Example 1: Keyword Search (Case-Insensitive)

```bash
curl "https://{your-lambda-url}.lambda-url.ap-northeast-1.on.aws/filter?feedUrl=https://news.example.com/rss&type=keyword&pattern=AI"
```

**Result**: "AI", "ai", "Ai" すべてマッチ（常に大文字小文字を区別しない）

---

### Example 2: Regex Filter (Breaking News)

```bash
curl "https://{your-lambda-url}.lambda-url.ap-northeast-1.on.aws/filter?feedUrl=https://news.example.com/rss&type=regex&pattern=%5EBreaking%3A"
```

**Note**: `%5EBreaking%3A` は `^Breaking:` のURLエンコード

**Result**: "Breaking:"で始まるタイトルのみ表示

---

### Example 3: Date Pattern Filter

```bash
curl "https://{your-lambda-url}.lambda-url.ap-northeast-1.on.aws/filter?feedUrl=https://blog.example.com/feed&type=regex&pattern=%5Cd%7B4%7D-%5Cd%7B2%7D-%5Cd%7B2%7D"
```

**Note**: `%5Cd%7B4%7D-%5Cd%7B2%7D-%5Cd%7B2%7D` は `\d{4}-\d{2}-\d{2}` のURLエンコード

**Result**: YYYY-MM-DD形式の日付を含むアイテムを抽出

---

### Example 4: Bug Tracker References

```bash
curl "https://{your-lambda-url}.lambda-url.ap-northeast-1.on.aws/filter?feedUrl=https://commits.example.com/feed&type=regex&pattern=bug-%5Cd%2B"
```

**Note**: `bug-%5Cd%2B` は `bug-\d+` のURLエンコード

**Result**: "bug-123", "bug-456"のようなバグIDを含むアイテムを抽出

---

## Error Handling

### Client Errors (400)

#### Invalid Regular Expression

```
HTTP/1.1 400 Bad Request
Content-Type: text/plain

無効な正規表現パターンです
```

**Solution**: 正規表現構文を確認してください。

#### Invalid URL

```
HTTP/1.1 400 Bad Request
Content-Type: text/plain

無効なフィードURLです
```

**Solution**: `http://` または `https://` で始まる有効なURLを指定してください。

---

### Server Errors (500)

#### Feed Fetch Error

```
HTTP/1.1 500 Internal Server Error
Content-Type: text/plain

フィードの取得に失敗しました
```

**Solution**: フィードURLが正しいか、アクセス可能か確認してください。

#### Parse Error

```
HTTP/1.1 500 Internal Server Error
Content-Type: text/plain

フィードの解析に失敗しました
```

**Solution**: フィードが有効なRSS 2.0またはAtom形式か確認してください。

---

## Performance Guidelines

| フィードサイズ | 推奨 | 最大 |
|---------------|------|------|
| アイテム数 | 100-1000件 | 5000件 |
| レスポンス時間 | <2秒 | <5秒 |
| 正規表現複雑性 | シンプルなパターン | 2000msタイムアウト |

---

## Development Setup

### Prerequisites

- Node.js 20.x LTS
- AWS Lambda Function URL
- `curl` or any HTTP client

### Test with Sample Feed

```bash
# 公開RSSフィードでテスト
curl "https://{your-lambda-url}.lambda-url.ap-northeast-1.on.aws/filter?feedUrl=https://www.reddit.com/r/technology/.rss&type=keyword&pattern=AI"
```

---

## Using with RSS Readers

### Feedly, Inoreader, NewsBlur等

フィルタリングされたフィードURLを直接RSSリーダーに登録できます：

```
https://{your-lambda-url}.lambda-url.ap-northeast-1.on.aws/filter?feedUrl=https://example.com/feed.xml&type=keyword&pattern=technology
```

---

## Common Use Cases

### 1. Personal News Aggregator

特定のトピックに関するニュースのみを購読:

```bash
# "climate"に関する記事のみをRSSリーダーに登録
https://{your-lambda-url}.lambda-url.ap-northeast-1.on.aws/filter?feedUrl=https://news.example.com/rss&type=keyword&pattern=climate
```

### 2. Developer Commit Feed

特定のバグ修正コミットを追跡:

```bash
# "fix:"で始まるコミットメッセージのみ
# URLエンコード: ^fix: → %5Efix%3A
https://{your-lambda-url}.lambda-url.ap-northeast-1.on.aws/filter?feedUrl=https://commits.example.com/feed&type=regex&pattern=%5Efix%3A
```

### 3. Security Alerts

セキュリティ関連の更新のみ抽出:

```bash
# "security", "vulnerability", "CVE"を含むアイテム
# URLエンコード: security|vulnerability|CVE-\d+ → security%7Cvulnerability%7CCVE-%5Cd%2B
https://{your-lambda-url}.lambda-url.ap-northeast-1.on.aws/filter?feedUrl=https://security.example.com/feed&type=regex&pattern=security%7Cvulnerability%7CCVE-%5Cd%2B
```

### 4. Blog Post Categories

特定のカテゴリの投稿のみ表示:

```bash
# "[Tutorial]"タグ付き記事
# URLエンコード: \[Tutorial\] → %5C%5BTutorial%5C%5D
https://{your-lambda-url}.lambda-url.ap-northeast-1.on.aws/filter?feedUrl=https://blog.example.com/feed&type=regex&pattern=%5C%5BTutorial%5C%5D
```

---

## Best Practices

### 1. Pattern Design

- **キーワード**: 短い単語またはフレーズを使用
- **正規表現**: シンプルなパターンを優先、複雑すぎると2000msでタイムアウト

### 2. URL Encoding

正規表現の特殊文字は必ずURLエンコードしてください：

| 文字 | URLエンコード |
|------|--------------|
| `^` | `%5E` |
| `$` | `%24` |
| `\` | `%5C` |
| `|` | `%7C` |
| `+` | `%2B` |
| `*` | `%2A` |

JavaScriptの例：
```javascript
const pattern = "^Breaking:";
const encoded = encodeURIComponent(pattern); // %5EBreaking%3A
```

### 3. Caching Strategy

RSSリーダー側でフィードをキャッシュすることを推奨：

```bash
# If-Modified-Since ヘッダーを使用して帯域幅を節約
curl -H "If-Modified-Since: Sat, 15 Feb 2026 10:00:00 GMT" \
  "https://{your-lambda-url}.lambda-url.us-east-1.on.aws/filter?..."
```

---

## Troubleshooting

### Issue: "正規表現の処理がタイムアウトしました" Error

**Cause**: 正規表現が複雑すぎる  
**Solution**: パターンを簡略化する

```bash
# ❌ 複雑すぎる
pattern=(a+)+b

# ✅ シンプル
pattern=a+b
```

### Issue: Empty Feed (アイテムが0件)

**Cause**: パターンがマッチしない  
**Solution**: 
1. キーワードのスペルを確認
2. より広いパターンを使用（例：`tech` の代わりに `technology|tech|technical`）
3. 元のフィードを確認（フィルタなしでアクセス）

### Issue: Slow Response

**Cause**: フィードサイズが大きい  
**Solution**:
1. より具体的なフィルタで結果を絞る
2. フィードソースで事前フィルタリング
3. 5000件未満のフィードを使用

### Issue: Invalid XML Error

**Cause**: 元のフィードが不正な形式  
**Solution**:
1. 元のフィードURLをブラウザで確認
2. RSS/Atom バリデーターでチェック（https://validator.w3.org/feed/）
3. 別のフィードソースを試す

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
