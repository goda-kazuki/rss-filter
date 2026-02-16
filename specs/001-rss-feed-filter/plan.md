# Implementation Plan: RSSフィードフィルタリング

**Branch**: `001-rss-feed-filtering` | **Date**: 2026-02-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-rss-feed-filter/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

RSSフィードフィルタリング機能を実装します。ユーザーはキーワード（部分一致）または正規表現でフィードアイテムをフィルタリングできます。AWS Lambda上でステートレス設計、TypeScript + Node.jsで実装し、fast-xml-parserでRSS/Atom解析、クライアント側フィルタリングを提供します。

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20.x LTS  
**Primary Dependencies**: fast-xml-parser (XML解析), esbuild (ビルド), vitest (テスト)  
**Storage**: N/A (ステートレス設計、セッション永続化なし)  
**Testing**: Vitest (ユニットテスト必須、統合テストはオプション)  
**Target Platform**: AWS Lambda (Function URLまたはAPI Gateway経由)
**Project Type**: single (サーバーレスバックエンドAPI)  
**Performance Goals**: 1000件フィード2秒以内、5000件フィード5秒以内でフィルタリング完了  
**Constraints**: Lambdaパッケージ50MB未満、ステートレス設計必須、コールドスタート最適化  
**Scale/Scope**: 5000件までのRSSフィードアイテム、キーワード/正規表現フィルタリング

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Alignment

| 原則 | 適合状況 | 備考 |
|------|---------|------|
| **I. Simplicity First** | ✅ PASS | YAGNI原則に準拠: 最小限の依存関係(fast-xml-parser, esbuild, vitest)のみ使用、過度な抽象化なし |
| **II. Type Safety** | ✅ PASS | TypeScript strict mode必須、any型禁止、全関数に明示的型定義 |
| **III. Error Handling** | ✅ PASS | RSS取得失敗、XML解析エラー、正規表現検証エラーを明示的に処理 |
| **IV. Stateless Design** | ✅ PASS | Lambda向けステートレス設計、リクエスト間の共有状態なし |

### Technical Stack Compliance

| 項目 | 憲章要件 | 実装計画 | 状況 |
|------|---------|---------|------|
| 言語 | TypeScript 5.x strict mode | TypeScript 5.x strict mode | ✅ |
| ランタイム | Node.js 20.x LTS | Node.js 20.x LTS | ✅ |
| インフラ | AWS Lambda | AWS Lambda | ✅ |
| ビルド | esbuild | esbuild | ✅ |
| テスト | Vitest | Vitest | ✅ |
| XMLパース | fast-xml-parser | fast-xml-parser | ✅ |
| リンター | ESLint + Prettier | ESLint + Prettier | ✅ |
| パッケージサイズ | <50MB | 依存関係最小限で達成可能 | ✅ |

**GATE STATUS**: ✅ **PASS** - すべての憲章要件を満たしています

**Post-Phase 1 Re-evaluation**: ✅ **CONFIRMED** - 設計完了後も憲章準拠を維持しています
- Strategy Patternの採用は「Simplicity First」に準拠 (過度な抽象化なし)
- すべてのエンティティに厳密な型定義を提供
- エラーハンドリング戦略を詳細化 (Result Type Pattern)
- APIはステートレス設計を完全実装

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── models/
│   ├── feed.ts          # RSSフィード、フィードアイテム型定義
│   └── filter.ts        # フィルタ基準、結果セット型定義
├── services/
│   ├── feed-fetcher.ts  # RSS取得・解析ロジック
│   ├── feed-filter.ts   # キーワード/正規表現フィルタリング
│   └── html-decoder.ts  # HTMLエンティティデコード
├── handlers/
│   └── lambda.ts        # Lambda関数エントリーポイント
└── lib/
    └── errors.ts        # カスタムエラー型

tests/
├── unit/
│   ├── feed-fetcher.test.ts
│   ├── feed-filter.test.ts
│   └── html-decoder.test.ts
└── integration/
    └── lambda.test.ts   # エンドツーエンドテスト
```

**Structure Decision**: Single project構成を採用。AWS Lambda関数として単一のデプロイ可能なアーティファクトを生成します。ビジネスロジック(services/)、型定義(models/)、Lambda統合(handlers/)を明確に分離し、テストは階層別に配置します。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

該当なし - すべての憲章要件に準拠しています。

---

## Phase Completion Status

### ✅ Phase 0: Outline & Research (Complete)

**Artifacts Generated**:
- ✅ `research.md` - 技術選定と実装パターンの調査完了

**Key Decisions**:
1. RSS/Atom解析: fast-xml-parser
2. HTMLデコード: he パッケージ
3. 正規表現安全性: タイムアウト機構(500ms)
4. フィルタリングアーキテクチャ: Strategy Pattern
5. パフォーマンス最適化: 早期リターン + 正規表現キャッシュ
6. Lambda設計: Single-Purpose Function + JSON API
7. エラーハンドリング: Result Type Pattern
8. テスト戦略: Unit Tests(必須) + Integration Tests(オプション)

**Status**: すべてのNEEDS CLARIFICATIONを解決済み

---

### ✅ Phase 1: Design & Contracts (Complete)

**Artifacts Generated**:
- ✅ `data-model.md` - 4つの主要エンティティ定義完了
- ✅ `contracts/openapi.yaml` - OpenAPI 3.0.3仕様書
- ✅ `contracts/api-contract.md` - API契約ドキュメント
- ✅ `quickstart.md` - クイックスタートガイド
- ✅ `.github/agents/copilot-instructions.md` - エージェントコンテキスト更新完了

**Key Deliverables**:
1. **データモデル**: RSSFeed, FeedItem, FilterCriteria, FilterResult
2. **APIエンドポイント**: POST /filter
3. **エラー型**: FeedFetchError, ParseError, FilterValidationError, RegexTimeoutError
4. **バリデーションルール**: 各エンティティの厳密な検証ロジック
5. **パフォーマンス保証**: 1000件/2秒、5000件/5秒

**Constitution Re-check**: ✅ PASS - 設計完了後も憲章準拠を維持

---

### ⏭️ Phase 2: Implementation Tasks (Next)

**Next Command**: `/speckit.tasks` または `.specify/scripts/bash/generate-tasks.sh`

**Expected Output**: `tasks.md` with implementation tasks breakdown

---

## Quick Reference

| ドキュメント | 目的 | パス |
|------------|------|------|
| **Feature Spec** | 機能仕様書 | `spec.md` |
| **Implementation Plan** | 実装計画 (このファイル) | `plan.md` |
| **Research** | 技術調査結果 | `research.md` |
| **Data Model** | エンティティ定義 | `data-model.md` |
| **API Contract** | REST API仕様 | `contracts/api-contract.md` |
| **OpenAPI Spec** | 機械可読API定義 | `contracts/openapi.yaml` |
| **Quickstart** | 使用ガイド | `quickstart.md` |
| **Tasks** | 実装タスク (Phase 2) | `tasks.md` (未作成) |

---

## Summary

RSSフィードフィルタリング機能の実装計画が完了しました:

✅ **憲章準拠**: すべてのCore Principles (Simplicity, Type Safety, Error Handling, Stateless)を満たす  
✅ **技術選定**: fast-xml-parser, esbuild, vitest, Strategy Pattern  
✅ **設計完了**: データモデル、APIコントラクト、エラーハンドリング戦略  
✅ **パフォーマンス**: 5000件フィード/5秒以内を保証  
✅ **エージェントコンテキスト**: Copilot向けに更新完了

**Next Steps**: Phase 2のタスク生成 (`/speckit.tasks`)で実装タスクを詳細化してください。
