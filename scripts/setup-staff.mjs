import {createInterface} from 'node:readline/promises';
import {Writable} from 'node:stream';
import {randomBytes,pbkdf2Sync} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
const filename = new URL('../.dev.vars',import.meta.url);
let hide = false;
const output = new Writable({write(chunk,encoding,done){if(!hide)process.stdout.write(chunk);done();}});
const prompt = createInterface({input:process.stdin,output,terminal:true});
try {
  const username = (await prompt.question('Staff username: ')).trim();
  process.stdout.write('Staff password (hidden, minimum 9 characters): ');
  hide = true;
  const password = await prompt.question('');
  hide = false;process.stdout.write('\n');
  if (!/^[a-zA-Z0-9._-]{3,100}$/.test(username)) throw new Error('Use 3–100 letters, numbers, dots, underscores or hyphens for the username.');
  if(password.length<9||password.length>256)throw new Error('Password must be 9–256 characters.');
  const salt = randomBytes(16).toString('hex');
  const hash = `pbkdf2$600000$${salt}$${pbkdf2Sync(password,Buffer.from(salt,'hex'),600000,32,'sha256').toString('hex')}`;
  let existing = '';
  try {existing=await readFile(filename,'utf8');} catch(error){if(error.code!=='ENOENT')throw error;}
  const preserved = existing.split(/\r?\n/).filter(line=>!/^STAFF_(USERNAME|PASSWORD_HASH|SESSION_SECRET)=/.test(line)).join('\n').trim();
  await writeFile(filename,`${preserved?preserved+'\n':''}STAFF_USERNAME=${JSON.stringify(username)}\nSTAFF_PASSWORD_HASH=${JSON.stringify(hash)}\nSTAFF_SESSION_SECRET=${JSON.stringify(randomBytes(32).toString('hex'))}\n`);
  console.log('Staff login configured in .dev.vars. Restart the development server. Previous sessions are invalidated.');
} catch(error){console.error(error.message);process.exitCode=1;} finally {prompt.close();}
