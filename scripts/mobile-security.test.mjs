import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=(await readFile(new URL('../lib/mobile-security.ts',import.meta.url),'utf8')).replace("'./staff-security'",JSON.stringify(new URL('../lib/staff-security.ts',import.meta.url).href));
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {normalizeMobile,localDevelopmentAllowed,codeHash,randomCode,mobileSession,sessionMobile}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('mobile numbers use one canonical identity',()=>{
  for(const phone of ['0710583780','+94710583780','94710583780','071 058 3780'])assert.equal(normalizeMobile(phone),'94710583780');
  for(const phone of ['071058378','07105837800','+1234567890','admin',null])assert.equal(normalizeMobile(phone),null);
});
test('development code delivery requires development mode and loopback',()=>{
  assert.equal(localDevelopmentAllowed(true,'http://localhost:5173'),true);
  assert.equal(localDevelopmentAllowed(true,'http://127.0.0.1:5173'),true);
  assert.equal(localDevelopmentAllowed(false,'http://localhost:5173'),false);
  assert.equal(localDevelopmentAllowed(true,'https://portal.example'),false);
});
test('codes are bound to phone, challenge and secret; sessions reject tampering',async()=>{
  const secret='a'.repeat(64),phone='94710583780';
  const hash=await codeHash('challenge',phone,'123456',secret);
  assert.notEqual(hash,await codeHash('challenge','94710000000','123456',secret));
  assert.notEqual(hash,await codeHash('other',phone,'123456',secret));
  assert.notEqual(hash,await codeHash('challenge',phone,'654321',secret));
  assert.match(randomCode(),/^\d{6}$/);
  const token=await mobileSession(phone,secret);
  assert.equal(await sessionMobile(token,secret),phone);
  assert.equal(await sessionMobile(token+'changed',secret),null);
  assert.equal(await sessionMobile(token,'b'.repeat(64)),null);
});
