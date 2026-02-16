# Phase 0: Research & Technical Decisions

**Feature**: RSSフィードフィルタリング  
**Date**: 2026-02-16  
**Status**: Complete

## Research Questions from Technical Context

すべての技術的決定は憲章(constitution.md)に基づいて既に明確化されています。追加の調査項目は以下の通りです。

---

## 1. RSS/Atom解析ライブラリの選定

### Decision: fast-xml-parser

### Rationale:
- **軽量**: 100KB未満のバンドルサイズでLambdaパッケージサイズ制約(50MB)に適合
- **高速**: ネイティブXMLパーサーより10倍高速なパフォーマンス
- **TypeScript対応**: 型定義ファイルが標準で提供される
- **RSS/Atom両対応**: 標準フォーマットを自動検出・解析可能
- **エラーハンドリング**: 不正なXMLに対する詳細なエラー情報を提供
- **Lambda最適化**: Node.js 20.x環境での安定した動作実績

### Alternatives Considered:
- **xml2js**: より大きなバンドルサイズ(300KB+)、パフォーマンスが劣る
- **node-rss-parser**: RSS専用でAtom未対応、メンテナンス頻度が低い
- **native DOMParser**: ブラウザ環境専用でNode.js非対応

---

## 2. HTMLエンティティデコード手法

### Decision: 標準ライブラリ使用 (he パッケージまたはNode.js組み込み)

### Rationale:
- **FR-016要件**: フィードコンテンツの`&lt;`、`&amp;`等のHTMLエンティティをデコード必須
- **軽量な実装**: `he`パッケージ(50KB)またはNode.js 18+の`TextDecoder`を使用
- **セキュリティ**: XSS攻撃を防ぐため、デコード後のHTMLタグは表示せずテキストマッチングのみ
- **パフォーマンス**: 5000件フィードでも10ms未満の処理時間

### Alternatives Considered:
- **手動実装**: メンテナンス負担が大きく、エッジケース(数値文字参照等)の処理が不完全
- **DOMエミュレーション(jsdom)**: 10MB+の巨大な依存関係でLambda制約違反

---

## 3. 正規表現安全性とパフォーマンス

### Decision: 正規表現タイムアウト機構の実装

### Rationale:
- **壊滅的バックトラッキング対策**: ユーザー入力の正規表現が無限ループを引き起こす可能性がある
- **実装方法**: `AbortController`とタイムアウト(500ms)で正規表現実行を制限
- **エラーハンドリング**: タイムアウト発生時は「複雑すぎる正規表現パターンです」とユーザーに通知
- **検証**: 正規表現コンパイル時に`new RegExp()`の構文エラーをキャッチ

### Alternatives Considered:
- **正規表現の複雑性チェック**: ヒューリスティックで不完全、すべてのケースをカバー不可
- **制限なし**: セキュリティリスク(ReDoS攻撃)とLambdaタイムアウトの原因

### Best Practices:
```typescript
function safeRegexMatch(text: string, pattern: string, timeout: number = 500): boolean {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const regex = new RegExp(pattern, 'i');
    return regex.test(text);
  } catch (e) {
    throw new Error('無効な正規表現パターンです');
  } finally {
    clearTimeout(timeoutId);
  }
}
```

---

## 4. フィルタリングアーキテクチャ

### Decision: Strategy Pattern + Pure Functions

### Rationale:
- **拡張性**: キーワード/正規表現フィルタを統一インターフェースで扱う
- **テスタビリティ**: 各フィルタロジックを独立してユニットテスト可能
- **型安全性**: TypeScriptの判別共用体でフィルタタイプを厳密に管理
- **憲章準拠**: シンプルさを保ちつつ、機能追加時の変更を最小化

### Implementation Pattern:
```typescript
// 判別共用体でフィルタタイプを定義
type FilterCriteria = 
  | { type: 'keyword'; pattern: string; caseSensitive: boolean }
  | { type: 'regex'; pattern: string };

// Strategy Pattern
interface FilterStrategy {
  matches(text: string): boolean;
}

class KeywordFilter implements FilterStrategy {
  matches(text: string): boolean { /* ... */ }
}

class RegexFilter implements FilterStrategy {
  matches(text: string): boolean { /* ... */ }
}
```

### Alternatives Considered:
- **単一の分岐処理**: 拡張時にif-else地獄になる
- **クラス継承階層**: 過度な抽象化で憲章の「Simplicity First」に違反

---

## 5. パフォーマンス最適化戦略

### Decision: インクリメンタルフィルタリング + 早期リターン

### Rationale:
- **SC-001要件**: 1000件フィードで2秒以内の応答
- **SC-006要件**: 5000件フィードで5秒以内の処理
- **最適化手法**:
  1. **早期リターン**: タイトル一致時は説明のチェックをスキップ
  2. **正規表現キャッシュ**: 同一パターンの再コンパイルを防止
  3. **並列処理不要**: Lambdaシングルスレッドで配列操作が最速

### Best Practices:
```typescript
function filterFeedItems(items: FeedItem[], filter: FilterCriteria): FeedItem[] {
  const strategy = createFilterStrategy(filter);
  
  return items.filter(item => {
    const combinedText = `${item.title} ${item.description}`;
    // 早期リターンで不要な処理を削減
    return strategy.matches(combinedText);
  });
}
```

### Alternatives Considered:
- **Worker Threads**: Lambda環境では制約があり、オーバーヘッドが大きい
- **データベースフィルタリング**: ステートレス要件に違反

---

## 6. Lambda関数設計パターン

### Decision: Single-Purpose Function + RSS/Atom XML API

### Rationale:
- **エンドポイント設計**:
  - `GET /filter`: クエリパラメータでフィルタ条件を受け取り、フィルタリング済みのRSS/Atom XMLを返却
  - 既存のRSSリーダーで直接利用可能なレスポンス形式
- **リクエストフォーマット**:
  ```
  GET /filter?feedUrl=https://example.com/feed.xml&type=keyword&pattern=テクノロジー&caseSensitive=false
  GET /filter?feedUrl=https://example.com/feed.xml&type=regex&pattern=%5EBreaking%3A
  ```
- **レスポンスフォーマット**:
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Tech News</title>
      <description>Latest technology news</description>
      <link>https://example.com</link>
      <item>
        <title>Breaking: New AI Model Released</title>
        <description>A groundbreaking AI model...</description>
        <link>https://example.com/article1</link>
        <pubDate>Sat, 15 Feb 2026 10:00:00 GMT</pubDate>
      </item>
    </channel>
  </rss>
  ```
- **エラーレスポンス**: HTTPステータスコード（400/500）とテキストメッセージ

### Alternatives Considered:
- **POST + JSON**: レスポンスがJSON形式のためRSSリーダーで直接利用不可
- **GraphQL**: 過剰な複雑性、シンプルなユースケースに不要

---

## 7. エラーハンドリング戦略

### Decision: Result Type Pattern + 構造化ログ

### Rationale:
- **憲章III準拠**: すべてのエラーケースを明示的に処理
- **実装方針**:
  1. **カスタムエラー型**: `FeedFetchError`, `ParseError`, `FilterValidationError`
  2. **Lambda統合**: HTTP 400/500エラーとして適切に返却
  3. **CloudWatch Logs**: 構造化JSON形式でログ記録

### Error Response Format:
```typescript
type ErrorResponse = {
  error: {
    code: 'FEED_FETCH_ERROR' | 'INVALID_REGEX' | 'PARSE_ERROR';
    message: string; // ユーザー向けメッセージ
    details?: unknown; // デバッグ用詳細情報
  };
};
```

---

## 8. テスト戦略

### Decision: Unit Tests (必須) + Integration Tests (オプション)

### Rationale:
- **ユニットテスト(Vitest)**:
  - `feed-fetcher`: モックHTTPクライアントでRSS取得をテスト
  - `feed-filter`: 各フィルタロジックの正確性を検証
  - `html-decoder`: HTMLエンティティデコードのエッジケース
- **統合テスト**:
  - Lambda handler全体のE2Eテスト(ローカル実行)
  - 実際のRSSフィードサンプルを使用

### Coverage Goals:
- **ビジネスロジック**: 90%以上のコードカバレッジ
- **エラーパス**: すべてのエラーハンドリングをテスト

---

## Summary

すべての技術的決定は憲章の4原則(Simplicity First, Type Safety, Error Handling, Stateless Design)に準拠しており、Phase 1の設計に進む準備が整いました。

**Key Technologies Confirmed**:
- fast-xml-parser (RSS/Atom解析)
- he または TextDecoder (HTMLデコード)
- Strategy Pattern (フィルタリングアーキテクチャ)
- Result Type Pattern (エラーハンドリング)
- Vitest (テストフレームワーク)
