import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findGifts, wishlistBalance } from '../lib/gift-finder.ts';
const wish = (id, props = {}) => ({id, title:id, state:'available', expires:null, paused:0, price:3000, priority:0, kind:'product', category:'Home & living', ...props});
test('finder respects budget boundaries and excludes unknown prices', () => {
  assert.deepEqual(findGifts([wish('a'),wish('b',{price:3001}),wish('c',{price:null})],3000,'anything').map(w=>w.id), ['a']);
});
test('finder excludes occupied, received and hidden wishes; allows expired holds', () => {
  const gifts=[wish('reserved',{state:'reserved',expires:200}),wish('expired',{state:'reserved',expires:100}),wish('hidden',{paused:1}),wish('bought',{state:'purchased'}),wish('received',{state:'received'})];
  assert.deepEqual(findGifts(gifts,null,'anything',100).map(w=>w.id),['expired']);
});
test('finder selects experiences and prioritizes owner favorites', () => {
  const gifts=[wish('normal'),wish('class',{kind:'experience'}),wish('favorite',{kind:'experience',priority:1})];
  assert.deepEqual(findGifts(gifts,null,'experience').map(w=>w.id),['favorite','class']);
});
test('unlimited budget admits wishes without known prices', () => {
  assert.equal(findGifts([wish('custom',{price:null})],null,'anything').length,1);
});
test('balance has stable boundaries and never discloses reservation status', () => {
  const gifts=[wish('a'),wish('b',{price:9000}),wish('c',{price:9001}),wish('d',{price:null}),wish('hidden',{paused:1})];
  const result=wishlistBalance(gifts,3000);
  assert.deepEqual(result.counts,[1,1,1]); assert.equal(result.unpriced,1); assert.equal(result.total,4);
  assert.deepEqual(result,wishlistBalance(gifts.map(w=>({...w,state:'handled'})),3000));
});
