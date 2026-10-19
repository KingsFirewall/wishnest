import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createApiHandler } from '../lib/api-handler.ts';
import { testDatabase } from './database.mjs';

const event = {title:'API test',occasion:'Birthday',date:'2020-01-01',message:'Test',currency:'USD',theme:'sage',visibility:'unlisted'};
const wish = {title:'Gift',note:'Test',kind:'product',category:'Other',price:1500,url:'https://example.com/item',image:'',priority:0,art:'gift'};
async function fixture(t) {
  const {db,pg}=await testDatabase(); t.after(()=>pg.close());
  const blobs=new Map(); let reads=0;
  const storage={
    async put(id,bytes) {const path='wish-photos/'+id;blobs.set(path,bytes);return path;},
    async get(path) {reads++;const bytes=blobs.get(path);return bytes?new Blob([bytes]).stream():null;},
    async delete(path) {blobs.delete(path);},
  };
  const client=(identity=null)=> {
    const handler=createApiHandler({getDb:()=>db,getUser:async()=>identity?{userId:identity,displayName:identity}:null,storage});
    return async (path,{method='GET',body,cookie='',origin='https://wishnest.test',headers={},bytes}={})=>{
      const response=await handler(new Request('https://wishnest.test/api/'+path,{method,headers:{...(origin?{Origin:origin}:{}),...(cookie?{Cookie:cookie}:{}),...headers},body:bytes??(body===undefined?undefined:JSON.stringify(body))}));
      const type=response.headers.get('content-type')||'';
      return {status:response.status,headers:response.headers,cookie:response.headers.get('set-cookie')?.split(';')[0],data:type.includes('application/json')?await response.json():new Uint8Array(await response.arrayBuffer())};
    };
  };
  return {pg,client,blobs,reads:()=>reads};
}
test('Postgres API: CRUD, atomic reservations, ownership, caps, privacy and validation',async t=>{
  const {pg,client}=await fixture(t);
  const owner=client('owner'),otherOwner=client('other'),guest=client();
  assert.equal((await guest('celebrations')).status,401);
  const id=(await owner('celebrations',{method:'POST',body:event})).data.id;
  const page=await owner('celebrations/'+id);const slug=page.data.celebration.slug;
  assert.ok(!('owner' in page.data.celebration));
  assert.equal((await otherOwner('celebrations/'+id)).status,404);
  assert.equal((await owner('celebrations')).data.celebrations[0].count,0);
  for (const url of ['javascript:alert(1)','http://example.com','https://user:password@example.com']) {
    assert.equal((await owner('celebrations/'+id+'/wishes',{method:'POST',body:{...wish,url}})).status,400);
  }
  const wid=(await owner('celebrations/'+id+'/wishes',{method:'POST',body:wish})).data.id;
  assert.equal((await owner('celebrations')).data.celebrations[0].count,1);
  const reserve='wishes/'+wid+'/reserve';
  assert.equal((await guest(reserve,{method:'POST',body:{},origin:'https://evil.test'})).status,403);
  assert.equal((await guest(reserve,{method:'POST',body:{},origin:null})).status,403);
  assert.equal((await owner(reserve,{method:'POST',body:{}})).status,403);
  const pair=await Promise.all([guest(reserve,{method:'POST',body:{}}),guest(reserve,{method:'POST',body:{}})]);
  assert.deepEqual(pair.map(r=>r.status).sort(),[200,409]);
  const winner=pair.find(r=>r.status===200), cookie=winner.cookie;
  assert.match(winner.headers.get('set-cookie'),/HttpOnly/);assert.match(winner.headers.get('set-cookie'),/SameSite=Lax/);
  assert.match(winner.headers.get('set-cookie'),/Max-Age=7776000/);assert.match(winner.headers.get('set-cookie'),/Secure/);
  const raw=cookie.split('=')[1];
  assert.equal((await pg.query('SELECT token FROM wishes WHERE id=$1',[wid])).rows[0].token,createHash('sha256').update(raw).digest('hex'));
  assert.ok(!JSON.stringify(winner.data).includes(raw));
  const mine=(await guest('lists/'+slug,{cookie})).data.wishes[0];
  assert.equal(mine.mine,true);assert.equal(typeof mine.expires,'number');assert.ok(!('token' in mine));
  const elsewhere=(await guest('lists/'+slug)).data.wishes[0];assert.equal(elsewhere.mine,false);assert.equal(elsewhere.expires,null);
  const hidden=(await owner('celebrations/'+id)).data.wishes[0];assert.equal(hidden.state,'handled');assert.equal(hidden.expires,null);assert.equal(hidden.extended,0);
  assert.equal((await owner('wishes/'+wid,{method:'PATCH',body:wish})).status,409);
  assert.equal((await owner('wishes/'+wid+'/pause',{method:'POST',body:{}})).status,409);
  assert.equal((await guest('wishes/'+wid+'/release',{method:'POST',body:{}})).status,403);
  assert.equal((await guest('wishes/'+wid+'/release',{method:'POST',body:{},cookie:'wn_guest='+crypto.randomUUID()})).status,409);
  assert.equal((await guest('wishes/'+wid+'/extend',{method:'POST',body:{},cookie})).status,200);
  assert.equal((await guest('wishes/'+wid+'/extend',{method:'POST',body:{},cookie})).status,409);
  assert.equal((await guest('wishes/'+wid+'/purchase',{method:'POST',body:{},cookie})).status,200);
  assert.equal((await guest('lists/'+slug,{cookie})).data.wishes[0].state,'purchased');
  assert.equal((await owner('celebrations/'+id)).data.wishes[0].state,'handled');
  assert.equal((await guest('wishes/'+wid+'/release',{method:'POST',body:{},cookie})).status,200);
  assert.equal((await owner('wishes/'+wid+'/pause',{method:'POST',body:{}})).status,200);
  assert.equal((await guest('lists/'+slug)).data.wishes.length,0);
  assert.equal((await guest(reserve,{method:'POST',body:{}})).status,404);
  assert.equal((await owner('wishes/'+wid+'/resume',{method:'POST',body:{}})).status,200);
  assert.equal((await owner('wishes/'+wid,{method:'PATCH',body:{...wish,title:'Updated'}})).status,200);
  // Exercise the cap with concurrent requests to distinct wishes under one cookie.
  const ids=[];
  for(let n=0;n<11;n++) ids.push((await owner('celebrations/'+id+'/wishes',{method:'POST',body:wish})).data.id);
  const reservations=await Promise.all(ids.map(i=>guest('wishes/'+i+'/reserve',{method:'POST',body:{},cookie})));
  assert.equal(reservations.filter(r=>r.status===200).length,10);
  assert.equal(reservations.filter(r=>r.status===429).length,1);
  await owner('celebrations/'+id,{method:'PATCH',body:{...event,visibility:'private'}});
  assert.equal((await guest('lists/'+slug)).status,404);
  assert.equal((await guest(reserve,{method:'POST',body:{}})).status,404);
  assert.equal((await owner('lists/'+slug)).status,200);
  const oversize=await owner('celebrations',{method:'POST',bytes:JSON.stringify({...event,message:'é'.repeat(6500)})});
  assert.equal(oversize.status,413);assert.equal(oversize.headers.get('cache-control'),'no-store');
});
test('private photos: byte limits, signatures, ownership, proxy URLs and access before storage reads',async t=>{
  const f=await fixture(t),owner=f.client('owner'),other=f.client('other'),guest=f.client();
  const bytes=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
  assert.equal((await guest('images',{method:'POST',bytes})).status,401);
  assert.equal((await owner('images',{method:'POST',bytes:new Uint8Array(2000001)})).status,413);
  assert.equal((await owner('images',{method:'POST',bytes,headers:{'content-length':'2000001'}})).status,413);
  assert.equal((await owner('images',{method:'POST',bytes:'not an image',headers:{'content-type':'image/png'}})).status,400);
  const uploaded=await owner('images',{method:'POST',bytes,headers:{'content-type':'application/octet-stream'}});
  assert.equal(uploaded.status,201);assert.match(uploaded.data.url,/^\/api\/images\/[a-f0-9-]{36}$/);
  const path=uploaded.data.url.slice(5);
  assert.equal((await guest(path)).status,404);assert.equal(f.reads(),0);
  const own=await owner(path);assert.equal(own.status,200);assert.equal(own.headers.get('content-type'),'image/png');
  assert.equal(own.headers.get('cache-control'),'private, no-store');assert.equal(own.headers.get('x-content-type-options'),'nosniff');
  const cid=(await owner('celebrations',{method:'POST',body:event})).data.id;
  const otherId=(await other('celebrations',{method:'POST',body:event})).data.id;
  assert.equal((await other('celebrations/'+otherId+'/wishes',{method:'POST',body:{...wish,image:uploaded.data.url}})).status,400);
  const linked=await owner('celebrations/'+cid+'/wishes',{method:'POST',body:{...wish,image:uploaded.data.url}});assert.equal(linked.status,201);
  assert.equal((await guest(path)).status,200);
  await owner('celebrations/'+cid,{method:'PATCH',body:{...event,visibility:'private'}});
  const reads=f.reads();assert.equal((await guest(path)).status,404);assert.equal(f.reads(),reads);
  assert.equal((await other(path)).status,404);assert.equal((await owner(path)).status,200);
});
test('errors are generic and forged legacy identity headers never authenticate',async()=>{
  const handler=createApiHandler({getUser:async()=>null,getDb:()=>{throw new Error('secret-database-url');},storage:{}});
  const forgedHeader=['oai','authenticated','user','id'].join('-');
  const unauth=await handler(new Request('https://wishnest.test/api/celebrations',{headers:{[forgedHeader]:'owner'}}));
  assert.equal(unauth.status,401);
  const original=console.error;console.error=()=>{};
  try {
    const failed=await handler(new Request('https://wishnest.test/api/lists/missing'));
    assert.equal(failed.status,500);assert.equal(failed.headers.get('cache-control'),'no-store');
    assert.ok(!(await failed.text()).includes('secret-database-url'));
  } finally { console.error=original; }
});
