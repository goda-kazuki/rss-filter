# API Contract: RSS Feed Filter

**Version**: 1.0.0  
**Protocol**: REST (RSS/Atom XML)  
**Date**: 2026-02-16

## Overview

このAPIは単一エンドポイント`GET /filter`を提供し、RSSフィードのフィルタリング機能を実現します。レスポンスはRSS/Atom XML形式で、既存のRSSリーダーで直接利用可能です。

---

## Endpoint: GET /filter

### Request

#### Query Parameters

| パラメータ | 型 | 必須 | 説明 | 例 |
|-----------|---|------|------|---|
| `feedUrl` | string | ✅ | RSSフィードURL (RSS 2.0/Atom) | `https://example.com/feed.xml` |
| `type` | string | ✅ | フィルタタイプ (`keyword` または `regex`) | `keyword` |
| `pattern` | string | ✅ | フィルタパターン (URLエンコード) | `テクノロジー` |
| `caseSensitive` | boolean | ❌ | 大文字小文字区別 (keyword時のみ、デフォルト: false) | `false` |

#### Example: Keyword Filter

```
GET /filter?feedUrl=https://example.com/feed.xml&type=keyword&pattern=テクノロジー&caseSensitive=false
```

#### Example: Regex Filter

```
GET /filter?feedUrl=https://example.com/feed.xml&type=regex&pattern=%5EBreaking%3A
```
（`%5EBreaking%3A` は `^Breaking:` のURLエンコード）

---

### Response: Success (200 OK)

#### Headers

```http
Content-Type: application/rss+xml; charset=utf-8
```
または
```http
Content-Type: application/atom+xml; charset=utf-8
```
（元のフィード形式に応じて自動選択）

#### Body: RSS 2.0 Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Tech News</title>
    <description>Latest technology news</description>
    <link>https://example.com</link>
    <item>
      <title>Breaking: New AI Model Released</title>
      <description>A groundbreaking AI model has been announced...</description>
      <link>https://example.com/article1</link>
      <pubDate>Sat, 15 Feb 2026 10:00:00 GMT</pubDate>
      <author>John Doe</author>
      <category>Technology</category>
      <category>AI</category>
      <guid>https://example.com/article1</guid>
    </item>
  </channel>
</rss>
```

#### Body: Atom Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Tech News</title>
  <subtitle>Latest technology news</subtitle>
  <link href="https://example.com"/>
  <updated>2026-02-15T10:00:00Z</updated>
  <entry>
    <title>Breaking: New AI Model Released</title>
    <summary>A groundbreaking AI model has been announced...</summary>
    <link href="https://example.com/article1"/>
    <updated>2026-02-15T10:00:00Z</updated>
    <author>
      <name>John Doe</name>
    </author>
  </entry>
</feed>
```

**重要**: フィルタリングされたアイテムのみが含まれます。元のフィード形式（RSS 2.0またはAtom）を保持します。

---

### Response: Client Error (400 Bad Request)

#### Headers

```http
Content-Type: text/plain; charset=utf-8
```

#### Body

```
無効なフィードURLです
```

#### Error Messages

- `無効なフィードURLです` - URLが不正またはhttp/https形式でない
- `無効な正規表現パターンです` - 正規表現の構文エラー
- `フィルタパターンが空です` - pattern が空文字列
- `無効なフィルタタイプです` - type が keyword でも regex でもない

---

### Response: Server Error (500 Internal Server Error)

#### Headers

```http
Content-Type: text/plain; charset=utf-8
```

#### Body

```
フィードの取得に失敗しました
```

#### Error Messages

- `フィードの取得に失敗しました` - ネットワークエラーまたは404
- `フィードの解析に失敗しました` - 不正なXML形式
- `正規表現の処理がタイムアウトしました` - 複雑すぎるパターン（500ms超過）

---

## Validation Rules

### Request Validation

| パラメータ | ルール | エラーメッセージ |
|-----------|--------|-----------------|
| `feedUrl` | 非空、http/https形式 | "無効なフィードURLです" |
| `type` | 'keyword' or 'regex' | "無効なフィルタタイプです" |
| `pattern` | 非空文字列 | "フィルタパターンが空です" |
| `caseSensitive` (keyword) | boolean (デフォルト: false) | "caseSensitiveはboolean型である必要があります" |

### Response Guarantees

- フィルタリングされたアイテムのみが含まれる
- 元のフィード形式（RSS 2.0またはAtom）を保持
- アイテムの順序は元のフィードと同じ
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

1. **空のフィルタパターン**: 400エラー ("フィルタパターンが空です")
2. **マッチなし**: 空の`<channel>`（RSSの場合）または空の`<feed>`（Atomの場合）
3. **全アイテムマッチ**: すべてのアイテムが含まれる
4. **フィードアイテムなし**: 空の`<channel>`または`<feed>`
5. **不正なXML**: 500エラー ("フィードの解析に失敗しました")
6. **ネットワークエラー**: 500エラー ("フィードの取得に失敗しました")
7. **複雑すぎる正規表現**: 500エラー ("正規表現の処理がタイムアウトしました")

---

## CORS Policy

AWS Lambda Function URLのデフォルト設定に従います。

```yaml
AllowOrigins: ["*"]
AllowMethods: ["GET"]
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
   - 入力: `GET /filter?feedUrl=...&type=keyword&pattern=tech`
   - 期待: 200 OK + RSS/Atom XML（フィルタリング済み）

2. **正常系 - 正規表現フィルタ**
   - 入力: `GET /filter?feedUrl=...&type=regex&pattern=%5EBreaking`
   - 期待: 200 OK + RSS/Atom XML（フィルタリング済み）

3. **異常系 - 無効なURL**
   - 入力: `feedUrl=invalid-url`
   - 期待: 400 Bad Request + "無効なフィードURLです"

4. **異常系 - 無効な正規表現**
   - 入力: `pattern=%5Bunclosed`
   - 期待: 400 Bad Request + "無効な正規表現パターンです"

5. **異常系 - フィード取得失敗**
   - 入力: 存在しないURL
   - 期待: 500 Internal Server Error + "フィードの取得に失敗しました"

6. **エッジケース - マッチなし**
   - 入力: マッチしないパターン
   - 期待: 200 OK + 空の`<channel>`または`<feed>`

---

## Summary

このAPIコントラクトは以下を保証します:

- **RSSリーダー互換**: レスポンスはRSS/Atom XML形式で既存ツールで利用可能
- **明確な責任境界**: クライアント(400)とサーバー(500)のエラーを分離
- **シンプルなエラー処理**: HTTPステータスコードとテキストメッセージ
- **パフォーマンス保証**: 5000件フィードで5秒以内
- **エラーハンドリング**: すべてのエラーケースを文書化
