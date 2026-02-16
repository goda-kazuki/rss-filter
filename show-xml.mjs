#!/usr/bin/env node
/**
 * XML出力を表示するスクリプト
 * 
 * 使い方:
 *   node show-xml.mjs
 */

import { handler } from './dist/index.js';

console.log('🔍 フィルタリング後のXML出力を表示\n');

const result = await handler({
  path: '/filter',
  queryStringParameters: {
    feedUrl: 'https://news.ycombinator.com/rss',
    type: 'keyword',
    pattern: 'AI'
  },
  httpMethod: 'GET',
  headers: {},
  body: null,
  isBase64Encoded: false
});

console.log('='.repeat(70));
console.log(`ステータスコード: ${result.statusCode}`);
console.log(`Content-Type: ${result.headers['Content-Type']}`);
console.log('='.repeat(70));
console.log('\n【フィルタリング後のRSS XML】\n');
console.log(result.body);
console.log('\n' + '='.repeat(70));

// 記事数をカウント
const itemCount = (result.body.match(/<item>/g) || []).length;
console.log(`\n📊 マッチした記事数: ${itemCount}件`);

// タイトル一覧を表示
console.log('\n📝 記事タイトル一覧:');
const titles = result.body.match(/<title>([^<]+)<\/title>/g);
if (titles) {
  titles.slice(1).forEach((title, index) => {
    const cleanTitle = title.replace(/<\/?title>/g, '');
    console.log(`   ${index + 1}. ${cleanTitle}`);
  });
}
