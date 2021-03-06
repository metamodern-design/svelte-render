import { existsSync, rmSync } from 'fs';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { promisify } from 'util';

import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import jsdom from 'jsdom';

import { render } from '../lib/index.js';


const { JSDOM } = jsdom;

const context = resolve(process.cwd(), 'test');
const src = resolve(context, 'fixtures/src');
const assets = resolve(context, 'fixtures/assets');
const dist = resolve(context, 'client-hydrate');

const test = suite('Client Hydrate');

test.before(async (env) => {
  await render(context, { src, dist, assets });

  const html = await readFile(
    resolve(dist, 'index.html'),
    'utf8',
  );
  
  const scriptTagStart = html.indexOf('<script src="/client-');
  const fileNameEnd = html.indexOf('"></script>');
  
  const fileName = html.slice(scriptTagStart + 14, fileNameEnd);
  const fullPath = resolve(dist, fileName);
  
  const scriptInserted = html.replace(`/${fileName}`, `file://${fullPath}`);
  
  const dom = new JSDOM(scriptInserted, {
    runScripts: "dangerously",
    resources: "usable",
  });
  
  await promisify(setTimeout)(3000);
  
  env.window = dom.window;
  env.hydrated = dom.window.document;
});


test.after((env) => {
  if (env.window) {
    env.window.close();
  }
  rmSync(dist, { recursive: true, force: true });
});


test('Always passes', () => {
  assert.ok(1);
});


test('SSR loads with hello world', (env) => {
  const { hydrated } = env;
  const hello = hydrated.getElementById('hello');
  
  assert.ok(hello);
 
  assert.is(
    hello.textContent.trim(),
    'Hello, World!',
  );
});


test('Client hydrates with assigned message prop', (env) => {
  const { hydrated } = env;
  const message = hydrated.getElementById('message');
  
  assert.ok(message);
  
  assert.is(
    message.textContent.trim(),
    'Have a lovely day!',
  );
});


test('Client hydrates with current datetime', (env) => {
  const { hydrated } = env;
  const time = hydrated.getElementById('time');
  
  assert.ok(time);
  
  assert.is.not(
    time.textContent.trim(),
    'The time is now 00:00:00 on 01/01/00.',
  );
});


test('Assets copied to dist', () => {
  assert.ok([
    'something.txt',
    'something-else.txt',
    'folder/file1.txt',
    'folder/file2.txt',
  ].every((filename) => existsSync(resolve(dist, filename))));
});


export default test;
