<!--
Sync Impact Report
==================
Version change: N/A → 1.0.0 (initial)
Modified principles: N/A (initial creation)
Added sections: Core Principles (4), Technical Stack, Development Workflow, Governance
Removed sections: N/A
Templates status:
  - .specify/templates/plan-template.md: ✅ compatible
  - .specify/templates/spec-template.md: ✅ compatible
  - .specify/templates/tasks-template.md: ✅ compatible
Follow-up TODOs: None
-->

# RSS Filter Service Constitution

## Core Principles

### I. Simplicity First

必要最小限の機能から始め、過剰な設計を避ける。

- YAGNI (You Aren't Gonna Need It) を徹底する
- 機能追加は明確なユースケースが存在する場合のみ許可
- 依存関係は最小限に保つ（外部ライブラリは慎重に選定）
- コードは読みやすさを優先し、過度な抽象化を避ける

**根拠**: AWS Lambda の制約（パッケージサイズ、コールドスタート）と保守性の観点から、シンプルさが最優先事項となる。

### II. Type Safety

TypeScript の型システムを最大限活用し、実行時エラーを防ぐ。

- `strict: true` を必須とする
- `any` 型の使用は禁止（`unknown` で代替）
- すべての関数引数・戻り値に明示的な型定義が必要
- RSS/XML のスキーマは型として定義する
- フィルタリング条件は型安全なインターフェースで表現

**根拠**: コンパイル時にエラーを検出することで、本番環境での障害を防ぎ、リファクタリングの安全性を確保する。

### III. Error Handling

すべてのエラーケースを明示的に処理し、適切なレスポンスを返す。

- エラーは専用の Result 型または try-catch で処理
- 外部 RSS フェッチ失敗は明確なエラーメッセージで返却
- 不正な XML フォーマットは適切にハンドリング
- フィルタリング条件の検証エラーは詳細を含める
- すべてのエラーは構造化ログに記録

**根拠**: サーバーレス環境ではデバッグが困難なため、エラー情報の充実が運用品質を左右する。

### IV. Stateless Design

Lambda 向けに状態を持たない設計を徹底する。

- リクエスト間で共有される状態は禁止
- キャッシュが必要な場合は外部サービス（ElastiCache 等）を使用
- 冪等性を考慮した処理設計
- グローバル変数の使用は初期化コストの軽減目的のみ許可

**根拠**: Lambda インスタンスは任意のタイミングで再利用・破棄されるため、ステートレス設計が信頼性の基盤となる。

## Technical Stack

本プロジェクトで使用する技術スタックを定義する。

| カテゴリ | 技術 | 備考 |
|----------|------|------|
| 言語 | TypeScript 5.x | strict モード必須 |
| ランタイム | Node.js 20.x LTS | AWS Lambda 対応バージョン |
| インフラ | AWS Lambda | Function URL または API Gateway 経由 |
| ビルド | esbuild | 高速バンドル、Lambda 最適化 |
| テスト | Vitest | 高速、TypeScript ネイティブ |
| XML パース | fast-xml-parser | 軽量、高速 |
| リンター | ESLint + Prettier | コードスタイル統一 |

**パッケージサイズ制約**: Lambda デプロイパッケージは 50MB 未満を維持する。

## Development Workflow

開発プロセスにおけるルールを定義する。

### コード品質ゲート

1. **型チェック**: `tsc --noEmit` がエラーなく通過すること
2. **リント**: `eslint` がエラーなく通過すること
3. **テスト**: すべてのユニットテストがパスすること
4. **ビルド**: Lambda 用バンドルが正常に生成されること

### ブランチ戦略

- `main`: 本番デプロイ可能な状態を維持
- `feature/*`: 機能開発用ブランチ

### プルリクエスト戦略

段階的なPR作成を推奨し、レビューの品質と速度を向上させる。

**PRサイズの目安**:
- **小（推奨）**: 1-2ファイル、100-300行変更
- **中（許容）**: 3-5ファイル、300-500行変更
- **大（要分割）**: 10+ファイル、1000+行変更

**分割の基準**:
1. 機能単位で分ける（型定義 → 実装 → テスト → ドキュメント）
2. 依存関係を考慮し、各PRは独立してビルド・テスト可能にする
3. 1つのPRは1日以内でレビュー完了できるサイズを目指す
4. tasks.mdで明示的にPRのブレークポイントを定義する

**推奨パターン**:
```
PR #1: プロジェクトセットアップ + 型定義
PR #2: コアロジック実装 + ユニットテスト
PR #3: API統合 + 統合テスト
PR #4: ドキュメント + 最終調整
```

**根拠**: 小さいPRは以下の利点がある:
- レビュー時間の短縮（15-30分/PR）
- 問題の早期発見
- 段階的な品質向上
- マージコンフリクトの削減
- レビュワーの負担軽減

### テスト要件

- ビジネスロジック（フィルタリング処理）はユニットテスト必須
- 外部 RSS フェッチはモック化してテスト
- 統合テストはオプション（ローカル Lambda 環境で実行）

## Governance

本 Constitution はプロジェクトの最上位ガイドラインであり、すべての設計・実装判断において参照される。

- Constitution に反する実装はコードレビューでリジェクトされる
- 原則の変更は、変更理由・影響範囲・移行計画を文書化した上で承認が必要
- Constitution のバージョニングはセマンティックバージョニングに従う
  - MAJOR: 原則の削除または根本的な変更
  - MINOR: 新しいセクション・原則の追加
  - PATCH: 文言の明確化、タイポ修正

**Version**: 1.0.0 | **Ratified**: 2026-02-16 | **Last Amended**: 2026-02-16
