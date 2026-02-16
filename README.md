# RSS Feed Filter API

キーワードまたは正規表現でRSSフィードをフィルタリングするAWS Lambdaベースのサーバーレスアプリケーションです。

## 機能

- ✅ **キーワードフィルタ**: 大文字小文字を区別せずにキーワード検索
- ✅ **正規表現フィルタ**: 強力なパターンマッチング機能
- ✅ **RSS/Atom対応**: RSS 2.0とAtomフィードの両方をサポート
- ✅ **HTMLエンティティデコード**: `&amp;`, `&lt;` などを自動変換
- ✅ **大規模フィード対応**: 最大5000アイテムまで処理可能
- ✅ **RSSリーダー互換**: FeedlyやInoreaderで直接利用可能なXML出力

## 使用方法

詳細な使用方法は [Quickstart Guide](specs/001-rss-feed-filter/quickstart.md) を参照してください。

### 基本的な使い方

```bash
# キーワードフィルタ（大文字小文字を区別しない）
curl "https://{your-lambda-url}.lambda-url.ap-northeast-1.on.aws/filter?feedUrl=https://news.example.com/rss&type=keyword&pattern=AI"

# 正規表現フィルタ
curl "https://{your-lambda-url}.lambda-url.ap-northeast-1.on.aws/filter?feedUrl=https://news.example.com/rss&type=regex&pattern=%5EBreaking%3A"
```

## 開発

### 必要な環境

- Node.js 20.x以上
- npm 10.x以上

### セットアップ

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# テスト実行
npm test

# Lintチェック
npm run lint
```

### テスト

```bash
# 全テスト実行
npm test

# カバレッジ付きテスト
npm run test:coverage
```

## デプロイ

### AWS Lambdaへのデプロイ

1. **ビルド**

```bash
npm run build
```

`dist/index.js` に約120KBのバンドルが生成されます。

2. **Lambda関数の作成**

```bash
# AWS CLIでLambda関数を作成（ap-northeast-1リージョン）
aws lambda create-function \
  --function-name rss-feed-filter \
  --runtime nodejs20.x \
  --role arn:aws:iam::{YOUR_ACCOUNT_ID}:role/{YOUR_LAMBDA_ROLE} \
  --handler index.handler \
  --zip-file fileb://dist/index.js \
  --region ap-northeast-1 \
  --timeout 30 \
  --memory-size 512
```

3. **Function URLの有効化**

```bash
# Lambda Function URLを作成
aws lambda create-function-url-config \
  --function-name rss-feed-filter \
  --auth-type NONE \
  --region ap-northeast-1

# パブリックアクセスを許可
aws lambda add-permission \
  --function-name rss-feed-filter \
  --statement-id FunctionURLAllowPublicAccess \
  --action lambda:InvokeFunctionUrl \
  --principal "*" \
  --function-url-auth-type NONE \
  --region ap-northeast-1
```

4. **デプロイの更新**

```bash
# コードの更新
cd dist
zip -r function.zip index.js
aws lambda update-function-code \
  --function-name rss-feed-filter \
  --zip-file fileb://function.zip \
  --region ap-northeast-1
cd ..
```

### 環境変数（オプション）

必要に応じて以下の環境変数を設定できます：

```bash
aws lambda update-function-configuration \
  --function-name rss-feed-filter \
  --environment "Variables={NODE_ENV=production}" \
  --region ap-northeast-1
```

## API仕様

### エンドポイント

```
GET /filter
```

### クエリパラメータ

| パラメータ | 必須 | 説明 | 例 |
|----------|------|------|-----|
| `feedUrl` | ✓ | RSSフィードのURL | `https://example.com/feed.xml` |
| `type` | ✓ | フィルタタイプ: `keyword` or `regex` | `keyword` |
| `pattern` | ✓ | 検索パターン | `AI` |

### レスポンス

- **成功 (200)**: RSS 2.0 XML形式でフィルタリングされたフィード
- **エラー (400)**: パラメータ検証エラー（プレーンテキスト）
- **エラー (500)**: サーバーエラー（プレーンテキスト）

詳細なAPI仕様は [API Contract](specs/001-rss-feed-filter/contracts/api-contract.md) を参照してください。

## アーキテクチャ

```
src/
├── handlers/
│   └── lambda.ts          # Lambda エントリポイント
├── services/
│   ├── feed-fetcher.ts    # RSS/Atomフィード取得・パース
│   ├── feed-filter.ts     # フィルタリングロジック
│   └── html-decoder.ts    # HTMLエンティティデコード
├── models/
│   ├── feed.ts           # フィードデータ型定義
│   └── filter.ts         # フィルタ基準型定義
└── lib/
    └── errors.ts         # カスタムエラー型
```

## ライセンス

ISC

## 作成者

このプロジェクトは [SpecKit](specs/) ワークフローを使用して作成されました。

## メモ

### /speckit.constitution

プロジェクトの原則を決めるようなイメージ

### rss-filter.worktrees

Git の worktree 機能を利用したディレクトリ

### /speckit.specify

仕様をヒアリングするようなイメージ
2回目以降に開発する場合は、このコマンドから。

生成されたファイルをレビューする順番

- plan.md - 全体の実装計画（まず全体像を把握）
- research.md - 技術的な決定事項
- data-model.md - データモデル
- api-contract.md - API契約（人間が読みやすい）
- openapi.yaml - API仕様（技術的）
- quickstart.md - クイックスタートガイド
- copilot-instructions.md - エージェント設定

### /speckit.plan

技術スタックやアーキテクチャの決定

### /speckit.tasks

実装のタスクを生成する

### /speckit.implement

タスクの実行


## 気になる点

仕様変更があったとき、最新の情報はどこを見ればいいのか

プルリクエストを出すタイミング（粒度が大きい）

worktree は VSCode で確認しづらい・・・