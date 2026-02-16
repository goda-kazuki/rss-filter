export class FeedFetchError extends Error {
  constructor(
    public readonly url: string,
    public readonly statusCode?: number,
    message?: string
  ) {
    super(message || `フィードの取得に失敗しました: ${url}`);
    this.name = 'FeedFetchError';
  }
}

export class ParseError extends Error {
  constructor(public readonly content: string, message?: string) {
    super(message || 'フィードの解析に失敗しました');
    this.name = 'ParseError';
  }
}

export class FilterValidationError extends Error {
  constructor(public readonly pattern: string, message?: string) {
    super(message || `無効なフィルタパターンです: ${pattern}`);
    this.name = 'FilterValidationError';
  }
}

export class RegexTimeoutError extends Error {
  constructor(public readonly pattern: string) {
    super(`正規表現が複雑すぎます: ${pattern}`);
    this.name = 'RegexTimeoutError';
  }
}
