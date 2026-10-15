import {database} from './index';
import {initialPackages} from '../lib/catalog';
import {catalogueSeedStatements} from '../lib/catalogue-seed';
export async function ensureCatalogue(){
 const db=database();
 await db.prepare('CREATE TABLE IF NOT EXISTS catalogue_state (key TEXT PRIMARY KEY)').run();
 const ready=await db.prepare("SELECT key FROM catalogue_state WHERE key='normal-catalogue-v1'").first();
 if(ready)return;
 const statements=catalogueSeedStatements(initialPackages);
 await db.batch(statements.map(s=>db.prepare(s.sql).bind(...s.bindings)));
}
