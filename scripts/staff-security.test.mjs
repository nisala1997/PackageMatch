import test from 'node:test';
import assert from 'node:assert/strict';
import {pbkdf2Sync} from 'node:crypto';
import {createSession,verifySession,verifyPassword,sameOrigin,sessionSeconds} from '../lib/staff-security.ts';
const secret='a'.repeat(64);
test('staff sessions reject missing, forged, expired and different-account tokens',async()=>{
  const now=1700000000000;
  const token=await createSession('admin',secret,now);
  assert.equal(await verifySession(token,'admin',secret,now),true);
  assert.equal(await verifySession('','admin',secret,now),false);
  assert.equal(await verifySession(token,'customer',secret,now),false);
  assert.equal(await verifySession(token,'admin','b'.repeat(64),now),false);
  assert.equal(await verifySession(token,'admin',secret,now+sessionSeconds*1000),false);
  const [,signature]=token.split('.');
  const forged=btoa(JSON.stringify({username:'admin',expires:1700000000+sessionSeconds}))+'.'+signature;
  // Change the account in a signed payload without knowing the secret.
  const changed=btoa(JSON.stringify({username:'other',expires:1700000000+sessionSeconds}))+'.'+signature;
  assert.equal(await verifySession(changed,'other',secret,now),false);
  assert.equal(await verifySession(forged+'.extra','admin',secret,now),false);
});
test('password verification rejects wrong passwords and malformed hashes',async()=>{
  const salt='01'.repeat(16);
  const hash=`pbkdf2$600000$${salt}$${pbkdf2Sync('correct password',Buffer.from(salt,'hex'),600000,32,'sha256').toString('hex')}`;
  assert.equal(await verifyPassword('correct password',hash),true);
  assert.equal(await verifyPassword('wrong password',hash),false);
  assert.equal(await verifyPassword('correct password',''),false);
});
test('write requests require a matching origin and reject cross-site requests',()=>{
  const request=headers=>new Request('https://portal.test/api/packages',{method:'POST',headers});
  assert.equal(sameOrigin(request({origin:'https://portal.test'})),true);
  assert.equal(sameOrigin(request({origin:'https://other.test'})),false);
  assert.equal(sameOrigin(request({})),false);
  assert.equal(sameOrigin(request({origin:'https://portal.test','sec-fetch-site':'cross-site'})),false);
});
