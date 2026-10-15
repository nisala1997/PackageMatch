import {addonPackages} from './addon-data';
import {z} from 'zod';
export const packageSchema=z.object({id:z.string().min(1).max(50),name:z.string().min(1).max(100),category:z.enum(['base','addon']).default('base'),billingCycle:z.enum(['renewing','one-time']).default('renewing'),validityDays:z.number().int().min(1).max(365).nullable().default(null),rental:z.number().nonnegative().max(1000000),rentalWithTax:z.number().nonnegative().max(1000000).nullable().default(null),data:z.number().nonnegative().max(1000000),voice:z.number().nonnegative().max(1000000),unlimited:z.boolean(),unlimitedData:z.boolean().default(false),sms:z.number().nonnegative().int().max(1000000),deposit:z.number().nonnegative().max(1000000),connectionFee:z.number().nonnegative().max(1000000).nullable().default(null),nightData:z.number().nonnegative().max(1000000).default(0),specialBenefits:z.string().max(3000).default(''),restrictions:z.string().max(2000).default(''),type:z.enum(['mobile','data']),active:z.boolean(),verified:z.boolean(),governmentOnly:z.boolean().default(false),source:z.string().max(500),validFrom:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),validTo:z.union([z.literal(''),z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])}).refine(p=>!p.verified||p.source.trim().length>0,{message:'Add a tariff reference before marking verified.'}).refine(p=>!p.validTo||p.validTo>=p.validFrom,{message:'End date must be after start date.'});
export type Package=z.infer<typeof packageSchema>;
const comboPackages=[999,1111,2222,3333,4444].map((rental,i)=>({id:`CMB0${i+1}`,name:['Combo 999','Combo 1111','Combo 3333','Combo 4444','Combo 5555'][i],rental,rentalWithTax:[1270.73,1413.2,2826.39,4239.59,5652.79][i],data:[15,25,70,140,300][i],voice:i===0?1000:0,unlimited:i>0,unlimitedData:false,sms:1000,deposit:[1200,1300,2700,4100,5500][i],type:'mobile',active:true,verified:true,source:'User-provided Combo catalogue',validFrom:'2026-01-01',validTo:'',connectionFee:null,nightData:0,specialBenefits:`${[5,10,10,10,20][i]} GB AI & EDU Anytime app data: ChatGPT, Claude, Copilot, Gemini, Coursera, Canva, Adobe Firefly, Resume Genius, Udemy, DeepSeek.`,restrictions:''}));
export type Needs={data:number;voice:number;sms:number;budget:number;deposit:number;type:'mobile'|'data'|'addon';current:string;unlimitedData?:boolean;unlimitedVoice?:boolean;governmentEmployee?:boolean};
export function recommend(catalog:Package[],n:Needs,today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Colombo'})){
 const eligible=catalog.filter(p=>p.id!==n.current&&p.active&&(!requiresGovernmentEmployment(p)||n.governmentEmployee===true)&&p.verified&&(n.type==='addon'?p.category==='addon':p.category!=='addon'&&p.type===n.type)&&p.validFrom<=today&&(!p.validTo||p.validTo>=today)&&(n.unlimitedData?p.unlimitedData:(p.unlimitedData||p.data>=n.data))&&(n.type==='data'||((n.unlimitedVoice?p.unlimited:(p.unlimited||p.voice>=n.voice))&&p.sms>=n.sms))&&(n.budget===0||p.rental<=n.budget)&&(n.deposit===0||p.deposit<=n.deposit));
 return eligible.sort((a,b)=>a.rental-b.rental||a.deposit-b.deposit||(a.unlimitedData?Infinity:a.data)-(b.unlimitedData?Infinity:b.data)||a.id.localeCompare(b.id)).slice(0,3);
}


const dataOnlyRows: [string,number,number,number,number][]=[
  [
    "New Super Data Package 01",
    8,
    496,
    612.56,
    700
  ],
  [
    "New Super Data Package 02",
    12,
    720,
    889.2,
    1000
  ],
  [
    "New Super Data Package 03",
    25,
    1200,
    1482,
    1500
  ],
  [
    "New Super Data Package 05",
    65,
    2015,
    2488.53,
    2500
  ],
  [
    "New Super Data Package 06",
    95,
    2850,
    3519.75,
    3500
  ],
  [
    "Anytime 10GB Data",
    10,
    660,
    815.1,
    1000
  ],
  [
    "Anytime 15GB Data",
    15,
    948,
    1170.78,
    1000
  ],
  [
    "Anytime 20GB Data",
    20,
    1188,
    1467.18,
    1500
  ],
  [
    "Anytime 30GB Data",
    30,
    1548,
    1911.78,
    2000
  ],
  [
    "Anytime 40GB Data",
    40,
    2028,
    2504.58,
    2000
  ],
  [
    "Anytime 50GB Data",
    50,
    2508,
    3097.38,
    2500
  ],
  [
    "Anytime 75GB Data",
    75,
    3588,
    4431.18,
    3500
  ],
  [
    "Anytime 100GB Data",
    100,
    4668,
    5764.98,
    4500
  ],
  [
    "Anytime 150GB Data",
    150,
    6948,
    8580.78,
    6500
  ],
  [
    "Anytime 250GB Data",
    250,
    11508,
    14212.38,
    12500
  ],
  [
    "Anytime 400GB Data",
    400,
    17988,
    22215.18,
    17500
  ],
  [
    "Anytime 550GB Data",
    550,
    23988,
    29625.18,
    21500
  ],
  [
    "Netflix Package",
    3,
    1798,
    2220.53,
    2000
  ]
];
const dataOnlyPackages=dataOnlyRows.map(([name,data,rental,rentalWithTax,deposit],index)=>({id:'data-sample-'+(index+1),name,data,rental,rentalWithTax,deposit,type:'data',voice:0,sms:0,unlimited:false,unlimitedData:false,active:true,verified:true,source:'User-provided Data Only catalogue',validFrom:'2026-01-01',validTo:'',specialBenefits:name==='Netflix Package'?'Streaming app benefits: Netflix, YouTube, Amazon Prime, Video Iiflix, ZeeS, Sriflix, PeoTV GO.':'',restrictions:''}));

export const initialPackages:Package[]=[...comboPackages,...dataOnlyPackages,...addonPackages,...[
  {
    "id": "CG249",
    "name": "Anytime Combo 249",
    "rental": 193.72,
    "rentalWithTax": 249,
    "deposit": 500,
    "data": 2,
    "voice": 250,
    "sms": 400,
    "unlimited": false,
    "unlimitedData": false,
    "type": "mobile",
    "active": true,
    "verified": true,
    "source": "User-provided package catalogue",
    "validFrom": "2026-01-01",
    "validTo": "",
    "connectionFee": null,
    "nightData": 0,
    "specialBenefits": "",
    "restrictions": ""
  },
  {
    "id": "CG333",
    "name": "Anytime Combo 333",
    "rental": 260.8,
    "rentalWithTax": 333,
    "deposit": 600,
    "data": 3.5,
    "voice": 250,
    "sms": 400,
    "unlimited": false,
    "unlimitedData": false,
    "type": "mobile",
    "active": true,
    "verified": true,
    "source": "User-provided package catalogue",
    "validFrom": "2026-01-01",
    "validTo": "",
    "connectionFee": null,
    "nightData": 0,
    "specialBenefits": "",
    "restrictions": ""
  },
  {
    "id": "CG444",
    "name": "Anytime Combo 444",
    "rental": 351.1,
    "rentalWithTax": 444,
    "deposit": 800,
    "data": 5,
    "voice": 300,
    "sms": 400,
    "unlimited": false,
    "unlimitedData": false,
    "type": "mobile",
    "active": true,
    "verified": true,
    "source": "User-provided package catalogue",
    "validFrom": "2026-01-01",
    "validTo": "",
    "connectionFee": null,
    "nightData": 0,
    "specialBenefits": "",
    "restrictions": ""
  },
  {
    "id": "STCM1",
    "name": "Standard Combo 555",
    "rental": 444.72,
    "rentalWithTax": 555,
    "deposit": 1000,
    "data": 7,
    "voice": 500,
    "sms": 500,
    "unlimited": false,
    "unlimitedData": false,
    "type": "mobile",
    "active": true,
    "verified": true,
    "source": "User-provided package catalogue",
    "validFrom": "2026-01-01",
    "validTo": "",
    "connectionFee": null,
    "nightData": 0,
    "specialBenefits": "",
    "restrictions": ""
  },
  {
    "id": "ULT30",
    "name": "One Shot Ultra",
    "rental": 1578.3,
    "rentalWithTax": 1989,
    "deposit": 2000,
    "data": 0,
    "voice": 0,
    "sms": 1000,
    "unlimited": true,
    "unlimitedData": true,
    "type": "mobile",
    "active": true,
    "verified": true,
    "source": "User-provided package catalogue",
    "validFrom": "2026-01-01",
    "validTo": "",
    "connectionFee": null,
    "nightData": 0,
    "specialBenefits": "",
    "restrictions": "No speed restrictions up to 80 GB; thereafter 1 Mbps. Video streaming is 360p throughout the package."
  },
  {
    "id": "DSCMB",
    "name": "Mobitel 1598",
    "rental": 1288.9,
    "rentalWithTax": 1598,
    "deposit": 1750,
    "data": 40,
    "voice": 0,
    "sms": 1000,
    "unlimited": true,
    "unlimitedData": false,
    "type": "mobile",
    "active": true,
    "verified": true,
    "source": "User-provided package catalogue",
    "validFrom": "2026-01-01",
    "validTo": "",
    "connectionFee": null,
    "nightData": 0,
    "specialBenefits": "Non-stop app data: Facebook, Instagram, YouTube, TikTok, Netflix, Spotify, WhatsApp, Messenger, FaceTime.",
    "restrictions": ""
  },
  {
    "id": "FYMWP",
    "name": "Mobitel 1278",
    "rental": 1030.81,
    "rentalWithTax": 1278,
    "deposit": 1500,
    "data": 10,
    "voice": 0,
    "sms": 1000,
    "unlimited": true,
    "unlimitedData": false,
    "type": "mobile",
    "active": true,
    "verified": true,
    "source": "User-provided package catalogue",
    "validFrom": "2026-01-01",
    "validTo": "",
    "connectionFee": null,
    "nightData": 0,
    "specialBenefits": "Non-stop app data: Facebook, YouTube, WhatsApp, Messenger.",
    "restrictions": ""
  },
  {
    "id": "UP499",
    "name": "Upahara 499",
    "rental": 499,
    "rentalWithTax": 634.73,
    "deposit": 0,
    "data": 15,
    "voice": 1000,
    "sms": 1000,
    "unlimited": false,
    "unlimitedData": false,
    "type": "mobile",
    "active": true,
    "verified": true,
    "source": "User-provided package catalogue",
    "validFrom": "2026-01-01",
    "validTo": "",
    "connectionFee": 750,
    "nightData": 0,
    "specialBenefits": "10 GB e-learning app data: MS Teams, Zoom, Office 365, Google Meet. 7.5 GB for navigation apps (Google Maps, Waze) and WhatsApp.",
    "restrictions": ""
  },
  {
    "id": "UP727",
    "name": "Upahara 727",
    "rental": 727,
    "rentalWithTax": 924.75,
    "deposit": 0,
    "data": 30,
    "voice": 1000,
    "sms": 1000,
    "unlimited": false,
    "unlimitedData": false,
    "type": "mobile",
    "active": true,
    "verified": true,
    "source": "User-provided package catalogue",
    "validFrom": "2026-01-01",
    "validTo": "",
    "connectionFee": 1000,
    "nightData": 0,
    "specialBenefits": "10 GB e-learning app data: MS Teams, Zoom, Office 365, Google Meet. 7.5 GB for navigation apps (Google Maps, Waze) and WhatsApp.",
    "restrictions": ""
  },
  {
    "id": "AIYOT",
    "name": "Hello AI",
    "rental": 640.86,
    "rentalWithTax": 799,
    "deposit": 1000,
    "data": 20,
    "voice": 200,
    "sms": 0,
    "unlimited": false,
    "unlimitedData": false,
    "type": "mobile",
    "active": true,
    "verified": true,
    "source": "User-provided package catalogue",
    "validFrom": "2026-01-01",
    "validTo": "",
    "connectionFee": null,
    "nightData": 20,
    "specialBenefits": "10 GB Anytime app data: ChatGPT, Claude, Copilot, Gemini, Coursera, Canva, Adobe Firefly, Resume Genius, Udemy, DeepSeek.",
    "restrictions": ""
  }
]].map(p=>packageSchema.parse({...p,governmentOnly:['UP499','UP727'].includes(p.id)}));

export function clearOldUpaharaCondition(p:Package):Package {
 const restrictions=p.restrictions.replace('SMS allowance not specified in the supplied table.','').trim();
 if(restrictions!==p.restrictions)p={...p,restrictions};
 if(['UP499','UP727'].includes(p.id)&&["Refundable deposit not specified in the supplied table. Confirm Upahara eligibility before offering.","Government employees only. No refundable deposit; a connection fee applies. Eligibility must be confirmed before activation."].includes(p.restrictions))return {...p,restrictions:''};
 return p;
}

export function requiresGovernmentEmployment(p:Package):boolean {
 return p.governmentOnly===true||['UP499','UP727'].includes(p.id)||/^upahara\b/i.test(p.name.trim());
}

function fallbackEligible(p:Package,n:Needs,today:string){
 return p.id!==n.current&&p.active&&(!requiresGovernmentEmployment(p)||n.governmentEmployee===true)&&p.verified&&(n.type==='addon'?p.category==='addon':p.category!=='addon'&&p.type===n.type)&&p.validFrom<=today&&(!p.validTo||p.validTo>=today);
}
function differences(p:Package,n:Needs){
 const gaps:{message:string;score:number}[]=[];
 if(n.unlimitedData&&!p.unlimitedData)gaps.push({message:'Data is limited; unlimited data requested.',score:1});
 else if(!p.unlimitedData&&p.data<n.data)gaps.push({message:`Anytime data is ${n.data-p.data} GB below your requirement.`,score:(n.data-p.data)/Math.max(n.data,1)});
 if(n.type!=='data'){
  if(n.unlimitedVoice&&!p.unlimited)gaps.push({message:'Calls are limited; unlimited calls requested.',score:1});
  else if(!p.unlimited&&p.voice<n.voice)gaps.push({message:`Calls are ${n.voice-p.voice} minutes below your requirement.`,score:(n.voice-p.voice)/Math.max(n.voice,1)});
  if(p.sms<n.sms)gaps.push({message:`SMS allowance is ${n.sms-p.sms} below your requirement.`,score:(n.sms-p.sms)/Math.max(n.sms,1)});
 }
 if(n.budget>0&&p.rental>n.budget)gaps.push({message:`Monthly rental exceeds your budget by Rs. ${(p.rental-n.budget).toFixed(2)} (excluding tax).`,score:(p.rental-n.budget)/n.budget});
 if(n.deposit>0&&p.deposit>n.deposit)gaps.push({message:`Refundable deposit exceeds your limit by Rs. ${(p.deposit-n.deposit).toFixed(2)}.`,score:(p.deposit-n.deposit)/n.deposit});
 return gaps;
}
export function recommendationGaps(p:Package,n:Needs){return differences(p,n).map(g=>g.message);}
export function recommendWithFallback(catalog:Package[],n:Needs,today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Colombo'})){
 const matches=recommend(catalog,n,today);
 const candidates=catalog.filter(p=>fallbackEligible(p,n,today)).map(p=>({p,gaps:differences(p,n)}));
 candidates.sort((a,b)=>a.gaps.reduce((sum,g)=>sum+g.score,0)-b.gaps.reduce((sum,g)=>sum+g.score,0)||a.gaps.length-b.gaps.length||a.p.rental-b.p.rental||a.p.deposit-b.p.deposit||a.p.id.localeCompare(b.p.id));
 const distance=(p:Package)=>p.unlimitedData?Infinity:Math.abs(p.data-n.data);
 const byData=(a:typeof candidates[number],b:typeof candidates[number])=>distance(a.p)-distance(b.p)||a.gaps.reduce((sum,g)=>sum+g.score,0)-b.gaps.reduce((sum,g)=>sum+g.score,0)||a.p.rental-b.p.rental||a.p.id.localeCompare(b.p.id);
 const lower=!n.unlimitedData&&n.data>0?[...candidates].filter(c=>!c.p.unlimitedData&&c.p.data<n.data).sort(byData)[0]:undefined;
 const upper=!n.unlimitedData?[...candidates].filter(c=>(c.p.unlimitedData||c.p.data>=n.data)&&(!matches.length||c.gaps.length===0)).sort(byData)[0]:undefined;
 const chosen=matches.length
  ? [upper?.p??matches[0],...(lower?[lower.p]:[]),...matches]
  : [...(lower?[lower.p]:[]),...(upper?[upper.p]:[])];
 if(!chosen.length&&candidates.length)chosen.push(candidates[0].p);
 const packages=[...new Map(chosen.map(p=>[p.id,p])).values()].slice(0,3);
 const partialIds=packages.filter(p=>differences(p,n).length>0).map(p=>p.id);
 return {packages,partialIds,nearest:packages.length>0&&partialIds.length===packages.length};
}

