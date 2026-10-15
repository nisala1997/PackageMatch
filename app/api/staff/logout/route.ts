import {sameOrigin,sessionCookie} from '../../../../lib/staff-security';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:'Request not allowed.'}, {status:403});
  return Response.json({ok:true}, {headers:{'Cache-Control':'no-store', 'Set-Cookie':`${sessionCookie}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${new URL(request.url).protocol==='https:'?'; Secure':''}`}});
}
