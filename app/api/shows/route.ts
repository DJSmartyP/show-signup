import { env } from 'cloudflare:workers';
const json = (data: unknown, status=200) => Response.json(data, {status, headers:{'Cache-Control':'no-store'}});
async function hash(token:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function GET(){try { const result = await env.DB!.prepare('SELECT id,title,premise,owner,start,duration FROM shows ORDER BY start').all();return json(result.results); }catch{return json({error:'The schedule is unavailable. Please try again.'},503);}}
export async function POST(req:Request){
 if(req.headers.get('origin') && req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Invalid request.'},403);
 let b: Record<string, any>;try{const value=await req.json();if(!value||typeof value!=='object'||Array.isArray(value))throw Error();b=value as Record<string, any>;}catch{return json({error:'Invalid submission.'},400);}
 const title=typeof b.title==='string'?b.title.trim():'';const owner=typeof b.owner==='string'?b.owner.trim():'';const premise=typeof b.premise==='string'?b.premise.trim():'';
 if(!title||title.length>100||!owner||owner.length>80||!premise||premise.length>1000||!Number.isInteger(b.start)||b.start<540||b.start%30!==0||![30,60].includes(b.duration)||b.start+b.duration>1440||typeof b.token!=='string'||b.token.length<32||b.token.length>100)return json({error:'Please complete all fields and choose a valid slot.'},400);
 const id=crypto.randomUUID();const statements=[env.DB!.prepare('INSERT INTO shows(id,title,premise,owner,start,duration,token_hash) VALUES(?,?,?,?,?,?,?)').bind(id,title,premise,owner,b.start,b.duration,await hash(b.token))];
 for(let m=b.start;m<b.start+b.duration;m+=30)statements.push(env.DB!.prepare('INSERT INTO slots(minute,show_id) VALUES(?,?)').bind(m,id));
 try{await env.DB!.batch(statements);return json({id},201);}catch(e){if(String(e).includes('UNIQUE'))return json({error:'That time has just been booked. Please choose another slot.'},409);return json({error:'Could not save your show. Please try again.'},503);}
}
export async function DELETE(req:Request){
 if(req.headers.get('origin') && req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Invalid request.'},403);
 let b: Record<string, any>;try{const value=await req.json();if(!value||typeof value!=='object'||Array.isArray(value))throw Error();b=value as Record<string, any>;}catch{return json({error:'Invalid request.'},400);}
 if(typeof b.id!=='string'||typeof b.token!=='string'||b.token.length>100)return json({error:'Invalid request.'},400);
 const tokenHash=await hash(b.token);
 await env.DB!.batch([env.DB!.prepare('DELETE FROM slots WHERE show_id IN (SELECT id FROM shows WHERE id=? AND token_hash=?)').bind(b.id,tokenHash),env.DB!.prepare('DELETE FROM shows WHERE id=? AND token_hash=?').bind(b.id,tokenHash)]);return json({ok:true});
}
