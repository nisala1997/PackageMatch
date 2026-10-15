import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=(await readFile(new URL('../lib/catalog.ts',import.meta.url),'utf8')).replace("'zod'",JSON.stringify(import.meta.resolve('zod'))).replace("'./addon-data'",JSON.stringify(new URL('../lib/addon-data.ts',import.meta.url).href));
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {packageSchema,initialPackages:samples,recommend,recommendWithFallback,recommendationGaps}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const base={...samples[0],id:'test',verified:true,source:'Approved tariff',rental:1000,data:0,voice:0,sms:100};
const needs={data:10000,voice:10000,sms:100,budget:2000,deposit:0,type:'mobile',current:''};
const today='2026-10-08';
test('the selected existing package is excluded from full, lower and upper recommendations',()=>{
 const current={...base,id:'current',data:20,voice:1000,sms:1000};
 const other={...current,id:'other',data:25};
 const request={...needs,data:20,voice:1000,sms:1000,current:'current'};
 assert.deepEqual(recommend([current,other],request,today).map(p=>p.id),['other']);
 assert.ok(recommendWithFallback([current,other],request,today).packages.every(p=>p.id!=='current'));
 assert.equal(recommendWithFallback([current],request,today).packages.length,0);
 assert.ok(recommendWithFallback([current,other],{...request,data:30,budget:1},today).packages.every(p=>p.id!=='current'));
});
test('data recommendations include the closest lower allowance even when upper packages match',()=>{
 const request={...needs,type:'data',data:20,voice:0,sms:0,budget:3000};
 const make=(id,data,rental)=>({...base,id,type:'data',data,rental,deposit:0});
 const lower=make('lower',15,500),farLower=make('far-lower',5,100),upper=make('upper',25,1500),farUpper=make('far-upper',100,1000);
 const result=recommendWithFallback([lower,farLower,upper,farUpper],request,today);
 assert.equal(result.packages[0].id,'upper');
 assert.ok(result.packages.some(p=>p.id==='lower'));
 assert.ok(!result.packages.some(p=>p.id==='far-lower'));
 assert.deepEqual(result.partialIds,['lower']);
 assert.equal(result.nearest,false);
 const noFull=recommendWithFallback([lower,upper],{...request,budget:1},today);
 assert.deepEqual(new Set(noFull.packages.map(p=>p.id)),new Set(['lower','upper']));
 assert.equal(noFull.nearest,true);
 assert.equal(recommendWithFallback([{...lower,governmentOnly:true},upper],request,today).packages.some(p=>p.id==='lower'),false);
 const unlimited=recommendWithFallback([lower,{...upper,unlimitedData:true}],{...request,unlimitedData:true},today);
 assert.ok(unlimited.packages.every(p=>p.unlimitedData));
});
test('Add-ons connection type matches add-ons without mixing standalone packages',()=>{
 const request={...needs,type:'addon',data:1.5,voice:0,sms:0,budget:150,deposit:0};
 const result=recommend(samples,request,today);
 assert.ok(result.length>0);
 assert.ok(result.every(p=>p.category==='addon'));
 assert.equal(recommend(samples.filter(p=>p.category!=='addon'),request,today).length,0);
 const fallback=recommendWithFallback(samples,{...request,data:99999,budget:1},today);
 assert.equal(fallback.nearest,true);
 assert.equal(fallback.packages[0].category,'addon');
 const voice=recommend(samples,{...request,data:5,voice:750,sms:750,budget:600},today);
 assert.ok(voice.length>0);
 assert.ok(voice.every(p=>p.voice>=750||p.unlimited));
});
test('add-ons retain prices, renewal and duration and cannot be recommended as base packages',()=>{
 const addons=samples.filter(p=>p.category==='addon');
 assert.equal(addons.length,36);
 const rollover=addons.find(p=>p.name==='Anytime Roll Over 500MB');
 assert.deepEqual([rollover.data,rollover.rental,rollover.rentalWithTax,rollover.validityDays,rollover.billingCycle],[0.5,46.96,58,7,'one-time']);
 const extension=addons.find(p=>p.name==='Extension Plan 5.5GB');
 assert.deepEqual([extension.data,extension.rental,extension.rentalWithTax,extension.validityDays],[5.5,480,592.8,30]);
 const max=addons.find(p=>p.name==='Max 1598');
 assert.equal(max.unlimited,true);assert.equal(max.unlimitedData,false);assert.equal(max.billingCycle,'renewing');
 const request={...needs,type:'data',data:0,voice:0,sms:0,budget:0};
 assert.equal(recommend(addons,request,today).length,0);
 assert.equal(recommendWithFallback(addons,request,today).packages.length,0);
 assert.ok(samples.some(p=>p.category==='addon'));
 assert.equal(packageSchema.parse({...base,category:undefined}).category,'base');
});
test('Data Only dataset includes all 18 supplied packages with accurate prices and deposits',()=>{
 const data=samples.filter(p=>p.type==='data'&&p.category!=='addon');
 assert.equal(data.length,18);
 assert.ok(data.every(p=>p.voice===0&&p.sms===0&&!p.unlimited&&!p.unlimitedData&&p.verified));
 const first=data.find(p=>p.name==='New Super Data Package 01');
 assert.deepEqual([first.data,first.rental,first.rentalWithTax,first.deposit],[8,496,612.56,700]);
 const large=data.find(p=>p.name==='Anytime 550GB Data');
 assert.deepEqual([large.data,large.rental,large.rentalWithTax,large.deposit],[550,23988,29625.18,21500]);
 const netflix=data.find(p=>p.name==='Netflix Package');
 assert.deepEqual([netflix.data,netflix.rental,netflix.rentalWithTax,netflix.deposit],[3,1798,2220.53,2000]);
 assert.match(netflix.specialBenefits,/Netflix.*YouTube.*PeoTV GO/);
 const request={...needs,type:'data',data:8,budget:500,sms:1000,voice:1000};
 assert.deepEqual(recommend(samples,request,today).map(p=>p.name),['New Super Data Package 01']);
 assert.equal(recommend([netflix],{...request,data:4,budget:0},today).length,0);
 assert.equal(recommendWithFallback(samples,{...request,data:1000,budget:1},today).packages[0].type,'data');
 assert.ok(samples.some(p=>p.name==='Anytime 550GB Data')); 
});
test('nearest fallback returns one option with honest allowance and cost differences',()=>{
 const pack={...base,data:10,voice:500,sms:500,rental:1000,deposit:1200};
 const request={...needs,data:20,voice:1000,sms:1000,budget:800,deposit:1000};
 const result=recommendWithFallback([pack],request,today);
 assert.equal(result.nearest,true);assert.equal(result.packages.length,1);
 assert.equal(recommendationGaps(pack,request).length,5);
 const closer={...pack,id:'closer',data:19,voice:950,sms:950,rental:900,deposit:1100};
 assert.equal(recommendWithFallback([pack,closer],request,today).packages[0].id,'closer');
});
test('fallback preserves full matches and never bypasses eligibility or tariff validity',()=>{
 const pack={...base,data:20,voice:1000,sms:1000};
 const request={...needs,data:20,voice:1000,sms:1000};
 assert.equal(recommendWithFallback([pack],request,today).nearest,false);
 for(const blocked of [{...pack,active:false},{...pack,verified:false},{...pack,governmentOnly:true},{...pack,type:'data'},{...pack,validTo:'2025-01-01'},{...pack,validFrom:'2030-01-01'}])assert.equal(recommendWithFallback([blocked],request,today).packages.length,0);
 assert.equal(recommendWithFallback([],request,today).packages.length,0);
 const unlimitedRequest={...request,unlimitedData:true,unlimitedVoice:true};
 assert.equal(recommendWithFallback([pack],unlimitedRequest,today).nearest,true);
 assert.equal(recommendationGaps(pack,unlimitedRequest).length,2);
});
test('both unlimited allowances cover usage without fake numeric limits',()=>{
  const both={...base,unlimitedData:true,unlimited:true};
  assert.equal(recommend([both],needs,today).length,1);
  assert.equal(recommend([{...both,unlimitedData:false}],needs,today).length,0);
  assert.equal(recommend([{...both,unlimited:false}],needs,today).length,0);
  assert.equal(recommend([{...both,rental:3000}],needs,today).length,0);
  assert.equal(recommend([{...both,sms:0}],needs,today).length,0);
});
test('Data Only supports unlimited data while excluding calls and SMS',()=>{
  assert.equal(recommend([{...base,type:'data',unlimitedData:true}],{...needs,type:'data'},today).length,1);
});
test('older packages default to limited data and can be edited safely',()=>{
  const old={...base};delete old.unlimitedData;
  assert.equal(packageSchema.parse(old).unlimitedData,false);
  assert.equal(recommend([old],needs,today).length,0);
  assert.equal(packageSchema.parse({...old,unlimitedData:true}).unlimitedData,true);
});
test('unlimited packages still sort by rental, deposit, and allowance',()=>{
  const rows=[{...base,id:'unlimited',unlimitedData:true,unlimited:true,deposit:0},{...base,id:'finite',data:20000,unlimited:true,deposit:0},{...base,id:'cheaper',rental:500,unlimitedData:true,unlimited:true,deposit:0}];
  assert.deepEqual(recommend(rows,needs,today).map(p=>p.id),['cheaper','finite','unlimited']);
});
test('customer unlimited choices exclude finite allowances even when they cover numeric usage',()=>{
  const finite={...base,data:1000000,voice:1000000,unlimited:false,unlimitedData:false};
  const data={...finite,id:'data',unlimitedData:true};
  const voice={...finite,id:'voice',unlimited:true};
  const both={...data,id:'both',unlimited:true};
  const catalog=[finite,data,voice,both];
  assert.deepEqual(recommend(catalog,{...needs,unlimitedData:true,unlimitedVoice:true},today).map(p=>p.id),['both']);
  assert.deepEqual(new Set(recommend(catalog,{...needs,unlimitedData:true},today).map(p=>p.id)),new Set(['data','both']));
  assert.deepEqual(new Set(recommend(catalog,{...needs,unlimitedVoice:true},today).map(p=>p.id)),new Set(['voice','both']));
  assert.equal(recommend([finite],needs,today).length,1);
  assert.equal(recommend([{...data,type:'data'}],{...needs,type:'data',unlimitedData:true,unlimitedVoice:true},today).length,1);
});
test('tax-inclusive rental is optional and does not change matching against the excluding-tax budget',()=>{
  const old={...base};delete old.rentalWithTax;
  assert.equal(packageSchema.parse(old).rentalWithTax,null);
  const taxed=packageSchema.parse({...base,rentalWithTax:1250,unlimited:true,unlimitedData:true});
  assert.equal(taxed.rentalWithTax,1250);
  assert.equal(recommend([taxed],{...needs,budget:1100},today).length,1);
  assert.equal(packageSchema.safeParse({...base,rentalWithTax:-1}).success,false);
});

test('recommendations use the tax-inclusive price from the saved catalogue',()=>{
 const saved={...samples[0],rentalWithTax:1299.50,deposit:1500};
 const result=recommend([saved],{...needs,data:15,voice:1000,sms:1000,budget:999},today);
 assert.equal(result[0].rentalWithTax,1299.50);
});

test('all supplied packages have correct tax prices and separate restricted benefits',()=>{
 assert.equal(samples.length,69);
 assert.equal(new Set(samples.map(p=>p.id)).size,69);
 assert.ok(samples.every(p=>p.verified&&packageSchema.safeParse(p).success));
 const byId=id=>samples.find(p=>p.id===id);
 assert.equal(byId('CG333').data,3.5);
 assert.equal(byId('UP499').connectionFee,750);
 assert.equal(byId('UP727').connectionFee,1000);
 assert.equal(byId('AIYOT').data,20);
 assert.equal(byId('AIYOT').nightData,20);
 assert.equal(byId('AIYOT').sms,0);
 assert.equal(byId('ULT30').unlimitedData,true);
 assert.match(byId('ULT30').restrictions,/80 GB.*1 Mbps/);
 assert.equal(byId('DSCMB').rentalWithTax,1598);
 assert.equal(byId('DSCMB').unlimitedData,false);
 assert.match(byId('DSCMB').specialBenefits,/Netflix/);
 assert.equal(recommend([byId('DSCMB')],{...needs,data:41,voice:0,sms:0},today).length,0);
 assert.equal(recommend([byId('AIYOT')],{...needs,data:21,voice:0,sms:0},today).length,0);
 assert.equal(recommend([byId('DSCMB')],{...needs,data:0,voice:0,sms:0,unlimitedData:true},today).length,0);
});

test('existing Combo sample codes match the updated user table',()=>{
 const combos=samples.filter(p=>/^CMB0[1-5]$/.test(p.id));
 assert.deepEqual(combos.map(p=>p.name),['Combo 999','Combo 1111','Combo 3333','Combo 4444','Combo 5555']);
 assert.deepEqual(combos.map(p=>p.rental),[999,1111,2222,3333,4444]);
 assert.deepEqual(combos.map(p=>p.rentalWithTax),[1270.73,1413.2,2826.39,4239.59,5652.79]);
 assert.deepEqual(combos.map(p=>p.deposit),[1200,1300,2700,4100,5500]);
 assert.deepEqual(combos.map(p=>p.data),[15,25,70,140,300]);
 assert.deepEqual(combos.map(p=>p.unlimited),[false,true,true,true,true]);
 assert.deepEqual(combos.map(p=>Number(p.specialBenefits.split(' ')[0])),[5,10,10,10,20]);
 assert.ok(combos.every(p=>p.sms===1000&&!p.unlimitedData&&p.verified));
});

test('Upahara recommendations require government employee declaration in both sample and live modes',()=>{
 const up=samples.find(p=>p.id==='UP499');
 const request={...needs,data:15,voice:1000,sms:1000};
 assert.equal(recommend([up],request,today).length,0);
 assert.equal(recommend([up],{...request,governmentEmployee:true},today).length,1);
 const legacy={...up};delete legacy.governmentOnly;
 assert.equal(recommend([legacy],request,today).length,0);
 assert.equal(recommend([{...up,id:'generated-id'}],request,today).length,0);
 const custom={...base,data:20,voice:1000,sms:1000,governmentOnly:true};
 assert.equal(recommend([custom],{...request},today).length,0);
 assert.equal(recommend([custom],{...request,governmentEmployee:true},today).length,1);
 assert.equal(recommend([up],{...request,governmentEmployee:true,budget:100},today).length,0);
});

test('Hello AI 799 matches without a student checkbox when allowances cover the request',()=>{
 const pack=samples.find(p=>p.id==='AIYOT');
 const request={...needs,data:20,voice:200,sms:0};
 assert.equal(recommend([pack],request,today).length,1);
 assert.equal(recommend([pack],{...request,sms:1},today).length,0);
});
