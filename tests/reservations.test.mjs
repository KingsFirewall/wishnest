import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { sql } from '../db/sql.ts';
import { publicWish, reservationSql, visibleState } from '../lib/domain.ts';
import { testDatabase } from './database.mjs';
let pg, db;
before(async () => {
  ({pg, db} = await testDatabase());
  await pg.exec("INSERT INTO celebrations(id,owner,slug,title,occasion,created) VALUES('list','owner','slug','Event','Birthday',1700000000000)");
});
after(async () => { await pg.close(); });
beforeEach(async () => {
  await pg.exec("DELETE FROM wishes; INSERT INTO wishes(id,celebration_id,title,position) VALUES('gift','list','Gift',1700000000000)");
});
const run = async query => (await db.execute(query)).rows.length;
test('only one competing reservation succeeds', async () => {
  const result = await Promise.all([run(reservationSql.reserve('guest-a',200,'gift',100)),run(reservationSql.reserve('guest-b',200,'gift',100))]);
  assert.deepEqual(result.sort(),[0,1]);
});
test('an expired hold can be reclaimed at the boundary', async () => {
  assert.equal(await run(reservationSql.reserve('a',200,'gift',100)),1);
  assert.equal(await run(reservationSql.reserve('b',300,'gift',200)),1);
});
test('a different guest cannot purchase or release someone’s hold', async () => {
  await run(reservationSql.reserve('a',200,'gift',100));
  assert.equal(await run(reservationSql.purchase('gift','b',150)),0);
  assert.equal(await run(reservationSql.release('gift','b')),0);
});
test('one extension only, and no purchase at or after expiry', async () => {
  await run(reservationSql.reserve('a',200,'gift',100));
  assert.equal(await run(reservationSql.extend('gift','a',150)),1);
  assert.equal(await run(reservationSql.extend('gift','a',150)),0);
  assert.equal(await run(reservationSql.purchase('gift','a',86400200)),0);
});
test('self-confirmed purchases do not expire or become verified', async () => {
  await run(reservationSql.reserve('a',200,'gift',100));
  assert.equal(await run(reservationSql.purchase('gift','a',150)),1);
  assert.equal(await run(reservationSql.reserve('b',1000,'gift',500)),0);
  assert.equal((await db.execute(sql`SELECT state FROM wishes`)).rows[0].state,'purchased');
  assert.equal(await run(reservationSql.release('gift','a')),1);
});
test('paused gifts cannot be reserved', async () => {
  await pg.exec('UPDATE wishes SET paused=1');
  assert.equal(await run(reservationSql.reserve('a',200,'gift',100)),0);
});
test('timestamps exceed int32 safely and SQL treats values as parameters', async () => {
  const token = "x'; DELETE FROM wishes; --";
  assert.equal(await run(reservationSql.reserve(token,1700000086400,'gift',1700000000000)),1);
  const row=(await db.execute(sql`SELECT * FROM wishes`)).rows[0];
  assert.equal(row.token,token);
  assert.equal(Number(row.expires),1700000086400);
  assert.equal(Number(row.position),1700000000000);
});
test('owner and other guests never receive private tokens or expiry details',()=>{const row={id:'gift',title:'Gift',note:'',kind:'product',category:'Other',price:1000,url:'',image:'',priority:0,art:'gift',paused:0,state:'reserved',token:'secret',expires:200,extended:1};const owner=publicWish(row,'secret',true,100);assert.equal(owner.state,'handled');assert.equal(owner.mine,false);assert.equal(owner.expires,null);assert.ok(!('token' in owner));const other=publicWish(row,'other',false,100);assert.equal(other.expires,null);assert.equal(other.extended,0);const mine=publicWish(row,'secret',false,100);assert.equal(mine.mine,true);assert.equal(mine.expires,200);assert.ok(!('token' in mine));});
test('expiration and purchase states are distinguishable',()=>{assert.equal(visibleState('reserved',200,200),'available');assert.equal(visibleState('purchased',null,999999),'purchased');});
