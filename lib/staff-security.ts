const encoder = new TextEncoder();
export const sessionCookie = 'packagefit_staff';
export const sessionSeconds = 8 * 60 * 60;

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
function fromHex(value: string) {
  return new Uint8Array(value.match(/../g)!.map(byte => parseInt(byte, 16)));
}
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterations, salt, expected] = stored.split('$');
  if (scheme !== 'pbkdf2' || iterations !== '600000' || !/^[a-f0-9]{32}$/.test(salt ?? '') || !/^[a-f0-9]{64}$/.test(expected ?? '')) return false;
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const actual = hex(await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt:fromHex(salt), iterations:600000}, key, 256));
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}
async function signingKey(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign','verify']);
}
export async function createSession(username: string, secret: string, now = Date.now()) {
  const payload = btoa(JSON.stringify({username, expires:Math.floor(now / 1000) + sessionSeconds}));
  const signature = hex(await crypto.subtle.sign('HMAC', await signingKey(secret), encoder.encode(payload)));
  return `${payload}.${signature}`;
}
export async function verifySession(token: string, username: string, secret: string, now = Date.now()) {
  try {
    const [payload, signature, extra] = token.split('.');
    if (extra !== undefined || !payload || !/^[a-f0-9]{64}$/.test(signature ?? '')) return false;
    if (!await crypto.subtle.verify('HMAC', await signingKey(secret), fromHex(signature), encoder.encode(payload))) return false;
    const data = JSON.parse(atob(payload));
    return data.username === username && Number.isInteger(data.expires) && data.expires > Math.floor(now / 1000) && data.expires <= Math.floor(now / 1000) + sessionSeconds;
  } catch { return false; }
}
export function sameOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin && request.headers.get('sec-fetch-site') !== 'cross-site';
}
