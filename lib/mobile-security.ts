import {createSession,verifySession} from './staff-security';
export const mobileCookie='packagefit_mobile';
export const initialAdmin='94710583780';
export function normalizeMobile(value: unknown): string | null {
  if(typeof value!=='string')return null;
  const digits=value.trim().replace(/[\s()-]/g,'').replace(/^\+/, '');
  const mobile=digits.startsWith('07')?'94'+digits.slice(1):digits;
  return /^947\d{8}$/.test(mobile)?mobile:null;
}
export function localDevelopmentAllowed(enabled: boolean, url: string) {
  return enabled&&['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname);
}
export async function codeHash(id: string, phone: string, code: string, secret: string) {
  const encoder=new TextEncoder();
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=await crypto.subtle.sign('HMAC',key,encoder.encode(`${id}:${phone}:${code}`));
  return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
export function randomCode() {
  const values=new Uint32Array(1);
  do {crypto.getRandomValues(values);} while(values[0]>=4294000000);
  return String(values[0]%1000000).padStart(6,'0');
}
export async function mobileSession(phone: string, secret: string){return createSession(phone,secret);}
export async function sessionMobile(token: string, secret: string) {
  try {
    const data=JSON.parse(atob(token.split('.')[0]));
    const phone=normalizeMobile(data.username);
    return phone&&await verifySession(token,phone,secret)?phone:null;
  } catch{return null;}
}
