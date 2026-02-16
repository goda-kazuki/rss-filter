---

description: "Implementation tasks for RSS Feed Filtering feature"
---

# Tasks: RSSフィードフィルタリング

**Input**: Design documents from `/specs/001-rss-feed-filter/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL and not included in this implementation plan per the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths follow the structure defined in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure with src/, tests/ directories per plan.md
- [ ] T002 Initialize TypeScript project with package.json (typescript 5.x, node 20.x)
- [ ] T003 [P] Install dependencies: fast-xml-parser, he for HTML entity decoding
- [ ] T004 [P] Install dev dependencies: vitest, esbuild, @types/node
- [ ] T005 [P] Configure tsconfig.json with strict mode enabled
- [ ] T006 [P] Configure ESLint and Prettier per constitution.md requirements
- [ ] T007 [P] Setup esbuild configuration for Lambda bundling in build.config.ts
- [ ] T008 [P] Create vitest.config.ts for unit testing

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 Create error types in src/lib/errors.ts (FeedFetchError, ParseError, FilterValidationError, RegexTimeoutError)
- [ ] T010 [P] Create RSSFeed interface in src/models/feed.ts per data-model.md
- [ ] T011 [P] Create FeedItem interface in src/models/feed.ts per data-model.md
- [ ] T012 [P] Create FilterCriteria type (KeywordFilter, RegexFilter) in src/models/filter.ts per data-model.md
- [ ] T013 [P] Create FilterResult interface in src/models/filter.ts per data-model.md
- [ ] T014 Implement feed-fetcher service in src/services/feed-fetcher.ts to fetch RSS from URL using fast-xml-parser
- [ ] T015 Implement HTML entity decoder in src/services/html-decoder.ts using he package
- [ ] T016 Create Lambda handler entry point in src/handlers/lambda.ts with query parameter parsing
- [ ] T017 Add input validation for query parameters (feedUrl, type, pattern) in src/handlers/lambda.ts
- [ ] T018 Add error mapping to HTTP status codes (400/500) in src/handlers/lambda.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 基本的なキーワードフィルタリング (Priority: P1) 🎯 MVP

**Goal**: ユーザーがシンプルなキーワードでRSSフィードアイテムをフィルタリングできる（大文字小文字を区別しない部分一致）

**Independent Test**: RSSフィードURLと「ニュース」などのキーワードを提供し、タイトルまたは説明に「ニュース」が含まれるアイテム（大文字小文字を区別しない）のみが表示されることを確認

### Implementation for User Story 1

- [ ] T019 [US1] Create keyword filter strategy in src/services/feed-filter.ts with case-insensitive matching logic
- [ ] T020 [US1] Implement applyKeywordFilter function in src/services/feed-filter.ts to filter FeedItem array
- [ ] T021 [US1] Add keyword filter logic to search both title and description fields
- [ ] T022 [US1] Integrate keyword filter into Lambda handler in src/handlers/lambda.ts
- [ ] T023 [US1] Implement RSS/Atom XML response generation in src/handlers/lambda.ts preserving original format
- [ ] T024 [US1] Add validation to ensure pattern is non-empty string
- [ ] T025 [US1] Handle empty results (no matches) and return empty channel/feed XML
- [ ] T026 [US1] Add logging for keyword filter operations in src/handlers/lambda.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 正規表現フィルタリング (Priority: P2)

**Goal**: 高度なユーザーが正規表現を使用して複雑なマッチングパターンを作成できる

**Independent Test**: 「^\[News\]」のような正規表現パターンを提供し、「[News]」で始まるタイトルのアイテムのみがマッチすることを確認

### Implementation for User Story 2

- [ ] T027 [US2] Create regex filter strategy in src/services/feed-filter.ts with regex compilation and validation
- [ ] T028 [US2] Implement applyRegexFilter function in src/services/feed-filter.ts to filter FeedItem array
- [ ] T029 [US2] Add regex pattern validation with try-catch for invalid patterns in src/services/feed-filter.ts
- [ ] T030 [US2] Implement regex timeout mechanism (2000ms) using AbortController in src/services/feed-filter.ts
- [ ] T031 [US2] Add regex filter logic to search both title and description fields
- [ ] T032 [US2] Integrate regex filter into Lambda handler in src/handlers/lambda.ts
- [ ] T033 [US2] Handle FilterValidationError for invalid regex patterns with 400 error response
- [ ] T034 [US2] Handle RegexTimeoutError for complex patterns with 500 error response
- [ ] T035 [US2] Add logging for regex filter operations in src/handlers/lambda.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - フィルタモード選択 (Priority: P3)

**Goal**: ユーザーがキーワードと正規表現フィルタリングモードを簡単に切り替えられる

**Independent Test**: キーワードモードで「test.*data」を入力し（文字通りマッチ）、次に正規表現モードに切り替えて（パターンマッチ）、結果が適切に変更されることを確認

### Implementation for User Story 3

- [ ] T036 [US3] Create unified filter function in src/services/feed-filter.ts accepting FilterCriteria union type
- [ ] T037 [US3] Implement filter type discrimination logic in src/services/feed-filter.ts (keyword vs regex)
- [ ] T038 [US3] Update Lambda handler to route to appropriate filter based on type parameter
- [ ] T039 [US3] Add validation to ensure type parameter is 'keyword' or 'regex'
- [ ] T040 [US3] Handle invalid type parameter with 400 error response
- [ ] T041 [US3] Add integration tests demonstrating mode switching behavior in tests/integration/lambda.test.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T042 [P] Add comprehensive unit tests for feed-fetcher in tests/unit/feed-fetcher.test.ts
- [ ] T043 [P] Add comprehensive unit tests for feed-filter in tests/unit/feed-filter.test.ts
- [ ] T044 [P] Add comprehensive unit tests for html-decoder in tests/unit/html-decoder.test.ts
- [ ] T045 [P] Add integration tests for Lambda handler in tests/integration/lambda.test.ts
- [ ] T046 [P] Update README.md with deployment instructions and usage examples
- [ ] T047 [P] Add performance monitoring logs (execution time per filter operation)
- [ ] T048 Validate against quickstart.md scenarios (all 4 examples must work)
- [ ] T049 [P] Code review and refactoring for clarity and maintainability
- [ ] T050 [P] Final constitution.md compliance check (Simplicity, Type Safety, Error Handling, Stateless)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1 but uses same base infrastructure
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Integrates US1 and US2 but independently testable

### Within Each User Story

- Models before services
- Services before handlers
- Core implementation before integration
- Validation before error handling
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T008)
- All Foundational model creation tasks marked [P] can run in parallel (T010-T013)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All unit test tasks marked [P] can run in parallel (T042-T045)
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# After Foundational phase is complete, launch User Story 1 tasks:
# These can be done in parallel if team has capacity:
Task T019: "Create keyword filter strategy in src/services/feed-filter.ts"
Task T024: "Add validation to ensure pattern is non-empty string"

# These must be sequential:
Task T019 → Task T020 → Task T022 → Task T023 (depends on previous implementation)
```

---

## Parallel Example: Polish Phase

```bash
# Launch all unit tests together after implementation is complete:
Task T042: "Add unit tests for feed-fetcher"
Task T043: "Add unit tests for feed-filter"  
Task T044: "Add unit tests for html-decoder"
Task T045: "Add integration tests for Lambda handler"

# Documentation and code cleanup in parallel:
Task T046: "Update README.md"
Task T049: "Code review and refactoring"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T008)
2. Complete Phase 2: Foundational (T009-T018) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T019-T026)
4. **STOP and VALIDATE**: Test User Story 1 independently using quickstart.md Example 1
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
   - Validates FR-003, SC-001, SC-002
3. Add User Story 2 → Test independently → Deploy/Demo
   - Validates FR-004, FR-005, SC-003, SC-008
4. Add User Story 3 → Test independently → Deploy/Demo
   - Validates FR-006, SC-004
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T018)
2. Once Foundational is done:
   - Developer A: User Story 1 (T019-T026)
   - Developer B: User Story 2 (T027-T035)
   - Developer C: User Story 3 (T036-T041)
3. Stories complete and integrate independently

---

## Implementation Notes

### Key Design Patterns

1. **Strategy Pattern**: FilterCriteria union type with keyword/regex discrimination
2. **Result Type Pattern**: Custom error types for explicit error handling
3. **Pure Functions**: All filter operations are stateless and side-effect free
4. **Early Return**: Title match skips description check for performance

### Performance Targets

- **1000 items**: Complete filtering within 2 seconds (SC-001)
- **5000 items**: Complete filtering within 5 seconds (SC-006)
- **Regex timeout**: 2000ms maximum execution time
- **Lambda memory**: 1GB recommended
- **Lambda timeout**: 30 seconds maximum

### File Organization Summary

```text
src/
├── models/
│   ├── feed.ts          # RSSFeed, FeedItem interfaces (T010, T011)
│   └── filter.ts        # FilterCriteria, FilterResult types (T012, T013)
├── services/
│   ├── feed-fetcher.ts  # RSS fetch & parse with fast-xml-parser (T014)
│   ├── feed-filter.ts   # Keyword & regex filtering logic (T019-T041)
│   └── html-decoder.ts  # HTML entity decoding with he (T015)
├── handlers/
│   └── lambda.ts        # Lambda entry point & request handling (T016-T018)
└── lib/
    └── errors.ts        # Custom error types (T009)

tests/
├── unit/
│   ├── feed-fetcher.test.ts  # (T042)
│   ├── feed-filter.test.ts   # (T043)
│   └── html-decoder.test.ts  # (T044)
└── integration/
    └── lambda.test.ts         # (T045)
```

### Constitution Compliance Checkpoints

- **Simplicity First**: Minimal dependencies (fast-xml-parser, he, esbuild, vitest only)
- **Type Safety**: TypeScript strict mode, no any types, explicit function signatures
- **Error Handling**: Custom error types with explicit handling at Lambda boundary
- **Stateless Design**: No shared state between requests, pure functional approach

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are OPTIONAL per feature spec (not explicitly requested)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Summary

**Total Tasks**: 50 tasks across 6 phases

**Task Count per User Story**:
- Setup: 8 tasks
- Foundational: 10 tasks (blocks all stories)
- User Story 1 (P1): 8 tasks - MVP scope
- User Story 2 (P2): 9 tasks
- User Story 3 (P3): 6 tasks
- Polish: 9 tasks

**Parallel Opportunities Identified**:
- Phase 1: 6 parallel tasks (T003-T008)
- Phase 2: 4 parallel model definitions (T010-T013)
- Phase 6: 5 parallel test/doc tasks (T042-T047)

**Independent Test Criteria**:
- US1: Keyword filter returns only matching items (case-insensitive)
- US2: Regex filter validates patterns and handles timeouts correctly
- US3: Filter type switching produces appropriate results for same pattern

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only)
- This delivers the core keyword filtering functionality
- Can be validated using quickstart.md Example 1
- Represents minimum viable product for basic use cases

**Format Validation**: ✅ All tasks follow the checklist format (checkbox, ID, labels, file paths)
