export type SeedPackage={id:string;[key:string]:unknown};
const seedKey='normal-catalogue-v1';
export function catalogueSeedStatements(packages:SeedPackage[]){
 const missing=`NOT EXISTS (SELECT 1 FROM catalogue_state WHERE key='${seedKey}')`;
 const inserts=[];
 // Keep both statement count and parameter count below D1 invocation limits.
 for(let offset=0;offset<packages.length;offset+=25){
  const group=packages.slice(offset,offset+25);
  inserts.push({sql:`INSERT INTO packages (id,payload) SELECT column1,column2 FROM (VALUES ${group.map(()=>'(?,?)').join(',')}) WHERE ${missing} ON CONFLICT(id) DO NOTHING`,bindings:group.flatMap(p=>[p.id,JSON.stringify(p)])});
 }
 return [
  {sql:'CREATE TABLE IF NOT EXISTS catalogue_state (key TEXT PRIMARY KEY)',bindings:[]},
  ...inserts,
  // Upgrade only previously imported sample records, preserving saved allowances,
  // prices, fees, eligibility, dates and active status.
  {sql:`UPDATE packages SET payload=json_set(payload,'$.verified',json('true'),'$.source','User-provided package catalogue') WHERE ${missing} AND id IN (${packages.map(()=>'?').join(',')}) AND json_extract(payload,'$.verified')=0 AND (json_extract(payload,'$.source') LIKE '%test tariff%' OR json_extract(payload,'$.source') LIKE 'Illustrative sample%')`,bindings:packages.map(p=>p.id)},
  {sql:'INSERT OR IGNORE INTO catalogue_state (key) VALUES (?)',bindings:[seedKey]},
 ];
}
