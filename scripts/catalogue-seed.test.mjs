import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {catalogueSeedStatements} from '../lib/catalogue-seed.ts';
test('the full catalogue is inserted in small batches',()=>{
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE packages (id TEXT PRIMARY KEY,payload TEXT NOT NULL)');
 const packages=Array.from({length:69},(_,i)=>({id:'package-'+i,name:'Package '+i,verified:true}));
 const statements=catalogueSeedStatements(packages);
 assert.ok(statements.length<10);
 assert.ok(statements.every(statement=>statement.bindings.length<=100));
 for(const statement of statements)db.prepare(statement.sql).run(...statement.bindings);
 assert.equal(db.prepare('SELECT COUNT(*) AS count FROM packages').get().count,69);
 db.close();
});
test('catalogue imports once, upgrades old samples and preserves saved edits and later deletions',()=>{
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE packages (id TEXT PRIMARY KEY,payload TEXT NOT NULL)');
 const insert=p=>db.prepare('INSERT INTO packages VALUES (?,?)').run(p.id,JSON.stringify(p));
 insert({id:'old',name:'Saved name',rentalWithTax:1299,active:false,verified:false,source:'User-supplied test tariff table; verify before customer offers'});
 insert({id:'custom',name:'Custom draft',verified:false,source:'Admin draft'});
 const catalogue=[{id:'new',name:'New package',verified:true},{id:'old',name:'Default name',verified:true},{id:'custom',name:'Default custom',verified:true}];
 function initialise(){
  db.exec('BEGIN');
  try{for(const statement of catalogueSeedStatements(catalogue))db.prepare(statement.sql).run(...statement.bindings);db.exec('COMMIT');}
  catch(error){db.exec('ROLLBACK');throw error;}
 }
 const get=id=>{const row=db.prepare('SELECT payload FROM packages WHERE id=?').get(id);return row?JSON.parse(row.payload):null;};
 initialise();
 assert.equal(get('new').verified,true);
 assert.equal(get('old').verified,true);
 assert.equal(get('old').name,'Saved name');
 assert.equal(get('old').rentalWithTax,1299);
 assert.equal(get('old').active,false);
 assert.equal(get('custom').verified,false);
 db.prepare('DELETE FROM packages WHERE id=?').run('new');
 initialise();
 assert.equal(get('new'),null);
 assert.equal(get('old').name,'Saved name');
 db.close();
});
