import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
import {sessionCookie,verifySession} from '../lib/staff-security';

export function staffConfig(){
 const username=env.STAFF_USERNAME,passwordHash=env.STAFF_PASSWORD_HASH,secret=env.STAFF_SESSION_SECRET;
 if(!username||!passwordHash||!secret||secret.length<32)return null;
 return {username,passwordHash,secret};
}

export async function canManagePackages(): Promise<boolean> {
  const config=staffConfig();
  if(!config)return false;
  const token=(await cookies()).get(sessionCookie)?.value;
  return !!token&&await verifySession(token,config.username,config.secret);
}
