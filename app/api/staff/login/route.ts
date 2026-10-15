import {database} from '../../../../db';
import {staffConfig} from '../../../package-access';
import {createSession,sameOrigin,sessionCookie,sessionSeconds,verifyPassword} from '../../../../lib/staff-security';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Request not allowed.'},{status:403});
 const config=staffConfig();
 if(!config)return Response.json({error:'Admin login is not configured. Run node scripts/setup-staff.mjs and restart the server.'},{status:503});
 try{
  const body=await request.json() as {username?:unknown;password?:unknown}|null;
  if(typeof body?.username!=='string'||typeof body.password!=='string'||body.username.length>100||body.password.length>256)return Response.json({error:'Enter your admin username and password.'},{status:400});
  const db=database(),now=Date.now();
  await db.prepare('CREATE TABLE IF NOT EXISTS staff_login_attempts (id TEXT PRIMARY KEY,attempts INTEGER NOT NULL,reset_at INTEGER NOT NULL)').run();
  const limit=await db.prepare(`INSERT INTO staff_login_attempts (id,attempts,reset_at) VALUES ('staff',1,?)
   ON CONFLICT(id) DO UPDATE SET attempts=CASE WHEN reset_at<=? THEN 1 ELSE attempts+1 END,
   reset_at=CASE WHEN reset_at<=? THEN excluded.reset_at ELSE reset_at END RETURNING attempts`).bind(now+15*60*1000,now,now).first<{attempts:number}>();
  if(!limit||limit.attempts>10)return Response.json({error:'Too many login attempts. Try again in 15 minutes.'},{status:429,headers:{'Retry-After':'900'}});
  const correct=await verifyPassword(body.password,config.passwordHash);
  if(body.username!==config.username||!correct)return Response.json({error:'Invalid username or password.'},{status:401});
  const token=await createSession(config.username,config.secret);
  return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':`${sessionCookie}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionSeconds}${new URL(request.url).protocol==='https:'?'; Secure':''}`}});
 }catch{return Response.json({error:'Admin login is unavailable. Please try again.'},{status:503});}
}
