#!/usr/bin/env node
/**
 * ローカル動作確認スクリプト
 * 
 * 使い方:
 *   node local-test.mjs
 */

import { handler } from './dist/index.js';

console.log('🚀 RSS Feed Filter - ローカル動作確認\n');

// テスト1: Hacker Newsのフィードから"AI"を含む記事を抽出
console.log('='.repeat(70));
console.log('📰 テスト1: キーワードフィルタ（AI）');
console.log('='.repeat(70));

const test1 = await handler({
  path: '/filter',
  queryStringParameters: {
    feedUrl: 'https://b9good.org/rss',
    type: 'keyword',
    pattern: '青の'
  },
  httpMethod: 'GET',
  headers: {},
  body: null,
  isBase64Encoded: false
});

console.log(`\nステータスコード: ${test1.statusCode}`);
console.log(`Content-Type: ${test1.headers['Content-Type']}`);

if (test1.statusCode === 200) {
  // マッチした記事数をカウント
  const itemCount = (test1.body.match(/<item>/g) || []).length;
  console.log(`✅ マッチした記事数: ${itemCount}件`);
  
  // 最初の記事のタイトルを表示
  const titleMatch = test1.body.match(/<title>([^<]+)<\/title>/g);
  if (titleMatch && titleMatch.length > 1) {
    console.log(`\n📝 最初の記事タイトル:`);
    console.log(`   ${titleMatch[1].replace(/<\/?title>/g, '')}`);
  }
} else {
  console.log(`❌ エラー: ${test1.body}`);
}

console.log('\n');

// テスト2: 正規表現フィルタ
console.log('='.repeat(70));
console.log('📰 テスト2: 正規表現フィルタ（数字を含むタイトル）');
console.log('='.repeat(70));

const test2 = await handler({
  path: '/filter',
  queryStringParameters: {
    feedUrl: 'https://news.ycombinator.com/rss',
    type: 'regex',
    pattern: '\\d+'
  },
  httpMethod: 'GET',
  headers: {},
  body: null,
  isBase64Encoded: false
});

console.log(`\nステータスコード: ${test2.statusCode}`);

if (test2.statusCode === 200) {
  const itemCount = (test2.body.match(/<item>/g) || []).length;
  console.log(`✅ マッチした記事数: ${itemCount}件`);
} else {
  console.log(`❌ エラー: ${test2.body}`);
}

console.log('\n');

// テスト3: エラーハンドリング（パラメータ不足）
console.log('='.repeat(70));
console.log('📰 テスト3: エラーハンドリング（feedUrl未指定）');
console.log('='.repeat(70));

const test3 = await handler({
  path: '/filter',
  queryStringParameters: {
    type: 'keyword',
    pattern: 'test'
  },
  httpMethod: 'GET',
  headers: {},
  body: null,
  isBase64Encoded: false
});

console.log(`\nステータスコード: ${test3.statusCode} (期待値: 400)`);
console.log(`エラーメッセージ: ${test3.body}`);
console.log(test3.statusCode === 400 ? '✅ 正常にエラーを返しています' : '❌ 予期しないレスポンス');

console.log('\n');

// テスト4: 無効な正規表現
console.log('='.repeat(70));
console.log('📰 テスト4: エラーハンドリング（無効な正規表現）');
console.log('='.repeat(70));

const test4 = await handler({
  path: '/filter',
  queryStringParameters: {
    feedUrl: 'https://news.ycombinator.com/rss',
    type: 'regex',
    pattern: '[invalid(('
  },
  httpMethod: 'GET',
  headers: {},
  body: null,
  isBase64Encoded: false
});

console.log(`\nステータスコード: ${test4.statusCode} (期待値: 400)`);
console.log(`エラーメッセージ: ${test4.body}`);
console.log(test4.statusCode === 400 ? '✅ 正常にエラーを返しています' : '❌ 予期しないレスポンス');

console.log('\n' + '='.repeat(70));
console.log('✨ 動作確認完了！');
console.log('='.repeat(70));
console.log('\n💡 ヒント: 実際のXML出力を見たい場合は:');
console.log('   node local-test.mjs | grep -A 50 "<?xml"');
console.log('\n📝 カスタムテストを実行したい場合は、このファイルを編集してください。\n');
