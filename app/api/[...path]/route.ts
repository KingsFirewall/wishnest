import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { publicWish, reservationSql, visibleState, occasions, categories } from "@/lib/domain";
import { z } from "zod";

export const dynamic = "force-dynamic";
const celebrationInput = z.object({ title: z.string().trim().min(1).max(90), occasion: z.enum(occasions as [string,...string[]]), date: z.string().refine(s => s === "" || /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s))), message: z.string().max(1000), currency: z.enum(["USD","EUR","GBP","EGP","AED"]), theme: z.enum(["peach","sage","lavender"]), visibility: z.enum(["unlisted","private"]) });
const externalUrl = z.string().max(2048).refine(s => { if (!s) return true; try { const u=new URL(s); return u.protocol==="https:" && !u.username && !u.password; } catch { return false; } }, "Use a complete https:// link.");
const wishInput = z.object({ title: z.string().trim().min(1).max(120), note: z.string().max(1000), kind: z.enum(["product","experience","custom"]), category: z.enum(categories as [string,...string[]]), price: z.number().int().min(0).max(100000000).nullable(), url: externalUrl, image: z.string().max(200).regex(/^(\/api\/images\/[a-f0-9-]+)?$/), priority: z.number().int().min(0).max(1), art: z.enum(["gift","coffee","camera","vase","book","headphones","trip"]) });
const response = (value: unknown, status=200, extra: Record<string,string>={}) => Response.json(value,{status,headers:{"Cache-Control":"no-store",...extra}});
const fail = (message: string, status=400) => response({error:message},status);
async function hash(value: string) { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,"0")).join(""); }
function cookie(req: Request) { return req.headers.get("cookie")?.match(/(?:^|;\s*)wn_guest=([a-f0-9-]{36})/)?.[1] ?? null; }
async function json(req: Request) { if (Number(req.headers.get("content-length")||0)>12000) throw new Error("Request is too large."); const raw=await req.text(); if(raw.length>12000) throw new Error("Request is too large."); return JSON.parse(raw); }

async function handle(req: Request) {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean).slice(1);
  const [resource,id,action] = parts;
  const write = req.method!=="GET";
  if(write && req.headers.get("origin") !== new URL(req.url).origin) return fail("This request must come from Wishnest.",403);
  if(!env.DB) return fail("The database is not connected yet.",503);
  const db=env.DB;
  const user=await getChatGPTUser();
  const guest=cookie(req); const guestHash=guest?await hash(guest):null;
  const ownerList=async(listId:string) => user ? db.prepare("SELECT * FROM celebrations WHERE id=? AND owner=?").bind(listId,user.userId).first<Record<string,unknown>>() : null;

  if(resource==="me" && req.method==="GET") return response({user:user?{name:user.displayName}:null});
  if(resource==="celebrations") {
    if(!user) return fail("Sign in to manage your celebrations.",401);
    if(req.method==="GET" && !id) {
      const {results}=await db.prepare("SELECT c.id,c.slug,c.title,c.occasion,c.date,c.message,c.currency,c.theme,c.visibility,COUNT(w.id) AS count FROM celebrations c LEFT JOIN wishes w ON w.celebration_id=c.id WHERE c.owner=? GROUP BY c.id ORDER BY c.created DESC").bind(user.userId).all();
      return response({celebrations:results});
    }
    if(req.method==="POST" && !id) {
      const c=celebrationInput.parse(await json(req)); const cid=crypto.randomUUID(); const slug=crypto.randomUUID();
      await db.prepare("INSERT INTO celebrations (id,owner,slug,title,occasion,date,message,currency,theme,visibility,created) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(cid,user.userId,slug,c.title,c.occasion,c.date,c.message,c.currency,c.theme,c.visibility,Date.now()).run();
      return response({id:cid},201);
    }
    const c=await ownerList(id); if(!c) return fail("Celebration not found.",404);
    if(req.method==="GET") {
      const {results}=await db.prepare("SELECT * FROM wishes WHERE celebration_id=? ORDER BY position,id").bind(id).all();
      const {owner: _owner,...safe}=c;
      return response({celebration:safe,wishes:results.map(w=>publicWish(w,null,true)),owner:true});
    }
    if(req.method==="PATCH") {
      const input=celebrationInput.parse(await json(req));
      await db.prepare("UPDATE celebrations SET title=?,occasion=?,date=?,message=?,currency=?,theme=?,visibility=? WHERE id=? AND owner=?").bind(input.title,input.occasion,input.date,input.message,input.currency,input.theme,input.visibility,id,user.userId).run();
      return response({ok:true});
    }
    if(req.method==="POST" && action==="wishes") {
      const w=wishInput.parse(await json(req));
      if(w.image && (!env.BUCKET || (await env.BUCKET.head(w.image.split("/").pop()!))?.customMetadata?.owner!==user.userId)) return fail("Photo not found.",400);
      const wid=crypto.randomUUID();
      await db.prepare("INSERT INTO wishes (id,celebration_id,title,note,kind,category,price,url,image,priority,art,position) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").bind(wid,id,w.title,w.note,w.kind,w.category,w.price,w.url,w.image,w.priority,w.art,Date.now()).run();
      return response({id:wid},201);
    }
  }

  if(resource==="lists" && req.method==="GET") {
    const c=await db.prepare("SELECT * FROM celebrations WHERE slug=?").bind(id).first<Record<string,unknown>>();
    const owner=!!user && c?.owner===user.userId;
    if(!c || c.visibility==="private" && !owner) return fail("This celebration is private or unavailable.",404);
    const {results}=await db.prepare("SELECT * FROM wishes WHERE celebration_id=? AND paused=0 ORDER BY position,id").bind(c.id).all();
    const {owner: _owner,...safe}=c;
    return response({celebration:safe,wishes:results.map(w=>publicWish(w,guestHash,owner)),owner});
  }

  if(resource==="wishes" && id) {
    const w=await db.prepare("SELECT w.*,c.owner,c.visibility FROM wishes w JOIN celebrations c ON c.id=w.celebration_id WHERE w.id=?").bind(id).first<Record<string,unknown>>();
    if(!w) return fail("Wish not found.",404);
    const owner=!!user && w.owner===user.userId;
    if(req.method==="PATCH" && !action) {
      if(!owner) return fail("Only the list owner can edit wishes.",403);
      if(visibleState(String(w.state),w.expires as number|null)!=="available") return fail("This gift is being handled. Its details are locked to protect the giver’s choice.",409);
      const input=wishInput.parse(await json(req));
      if(input.image && input.image!==w.image && (!env.BUCKET || (await env.BUCKET.head(input.image.split("/").pop()!))?.customMetadata?.owner!==user!.userId)) return fail("Photo not found.");
      const result=await db.prepare("UPDATE wishes SET title=?,note=?,kind=?,category=?,price=?,url=?,image=?,priority=?,art=? WHERE id=? AND (state='available' OR (state='reserved' AND expires<=?))").bind(input.title,input.note,input.kind,input.category,input.price,input.url,input.image,input.priority,input.art,id,Date.now()).run();
      return result.meta.changes?response({ok:true}):fail("A guest just reserved this gift. Refresh to see its status.",409);
    }
    if(req.method!=="POST") return fail("Method not supported.",405);
    if(["pause","resume","received","reopen"].includes(action)) {
      if(!owner) return fail("Only the list owner can do this.",403);
      if(action==="pause" || action==="resume") {
        const r=await db.prepare("UPDATE wishes SET paused=? WHERE id=? AND (state='available' OR (state='reserved' AND expires<=?))").bind(action==="pause"?1:0,id,Date.now()).run();
        return r.meta.changes?response({ok:true}):fail("You can pause a wish once its reservation is released.",409);
      }
      if(action==="reopen") {
        const c=await db.prepare("SELECT date FROM celebrations WHERE id=?").bind(w.celebration_id).first<{date:string}>();
        if(!c?.date || Date.parse(c.date+"T23:59:59Z")>Date.now()) return fail("Reopen missing gifts after the celebration date.",409);
      }
      await db.prepare("UPDATE wishes SET state=?,token=NULL,expires=NULL,extended=0 WHERE id=?").bind(action==="received"?"received":"available",id).run();
      return response({ok:true});
    }
    if(w.visibility!=="unlisted" || w.paused) return fail("This gift is unavailable.",404);
    if(owner) return fail("Owners cannot reserve their own gifts. Use the sample list to try the guest experience.",403);
    let token=guest; let tokenHash=guestHash;
    if(action==="reserve") {
      token=token||crypto.randomUUID(); tokenHash=tokenHash||await hash(token);
      const count=await db.prepare("SELECT COUNT(*) AS n FROM wishes WHERE token=? AND state='reserved' AND expires>?").bind(tokenHash,Date.now()).first<{n:number}>();
      if((count?.n??0)>=10) return fail("Please finish or release an existing reservation first.",429);
      const now=Date.now(); const expires=now+86400000;
      const result=await db.prepare(reservationSql.reserve).bind(tokenHash,expires,id,now).run();
      if(!result.meta.changes) return fail("Someone else has reserved this gift. Please choose another.",409);
      return response({ok:true,expires},200,{"Set-Cookie":`wn_guest=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=7776000${new URL(req.url).protocol==="https:"?"; Secure":""}`});
    }
    if(!tokenHash) return fail("Open this reservation in the browser where you made it.",403);
    if(action==="extend" || action==="purchase" || action==="release") {
      const statement=db.prepare(reservationSql[action]);
      const result=await (action==="release"?statement.bind(id,tokenHash):statement.bind(id,tokenHash,Date.now())).run();
      return result.meta.changes?response({ok:true}):fail("This reservation expired, was changed, or cannot be extended again. Refresh the list.",409);
    }
  }

  if(resource==="images") {
    if(!env.BUCKET) return fail("Photo storage is not connected.",503);
    if(req.method==="POST") {
      if(!user) return fail("Sign in to upload a photo.",401);
      if(Number(req.headers.get("content-length")||0)>2100000) return fail("Choose a photo smaller than 2 MB.",413);
      const bytes=new Uint8Array(await req.arrayBuffer()); if(bytes.length>2000000) return fail("Choose a photo smaller than 2 MB.",413);
      const jpeg=bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
      const png=[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
      const webp=new TextDecoder().decode(bytes.slice(0,4))==="RIFF" && new TextDecoder().decode(bytes.slice(8,12))==="WEBP";
      if(!jpeg&&!png&&!webp) return fail("Use a JPG, PNG, or WebP photo.");
      const key=crypto.randomUUID(); await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:jpeg?"image/jpeg":png?"image/png":"image/webp"},customMetadata:{owner:user.userId}});
      return response({url:`/api/images/${key}`},201);
    }
    if(req.method==="GET" && /^[a-f0-9-]{36}$/.test(id||"")) {
      const asset=await env.BUCKET.get(id); if(!asset) return fail("Photo not found.",404);
      const linked=await db.prepare("SELECT c.owner,c.visibility FROM wishes w JOIN celebrations c ON c.id=w.celebration_id WHERE w.image=?").bind(`/api/images/${id}`).first<{owner:string;visibility:string}>();
      if(asset.customMetadata?.owner!==user?.userId && linked?.visibility!=="unlisted") return fail("Photo not found.",404);
      return new Response(asset.body,{headers:{"Content-Type":asset.httpMetadata?.contentType||"image/jpeg","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
    }
  }
  return fail("Not found.",404);
}
async function route(req:Request) { try { return await handle(req); } catch(e) { if(e instanceof z.ZodError) return fail(e.issues[0]?.message||"Check the fields and try again."); if(e instanceof SyntaxError) return fail("Invalid request."); console.error("Wishnest request failed",e instanceof Error?e.message:"unknown"); return fail("We couldn’t save that change. Please try again.",500); } }
export {route as GET,route as POST,route as PATCH};
