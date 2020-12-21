import { access, readFile, rmdir } from 'fs/promises';
import { resolve } from 'path';
import { promisify } from 'util';

import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import jsdom from 'jsdom';

import render from '../lib/index.js';


const { JSDOM } = jsdom;

const context = resolve(process.cwd(), 'test');
const assets = resolve(context, 'fixtures/assets');
const src = resolve(context, 'fixtures/src');
const dist = resolve(context, 'development');

const test = suite('Development');


test.before(async (env) => {
  await render(context, { src, dist, assets, development: true });

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
  
  env.hydrated = dom.window.document;
});


test.after(() => {
  rmdir(dist, { recursive: true });
});


test('Always passes', () => {
  assert.ok(1);
});


test('Client generates DOM with hello world', (env) => {
  const { hydrated } = env;
  const hello = hydrated.getElementById('hello');
  
  assert.ok(hello);
 
  assert.is(
    hello.textContent.trim(),
    'Hello, World!',
  );
});


test('Client generates DOM with assigned message prop', (env) => {
  const { hydrated } = env;
  const message = hydrated.getElementById('message');
  
  assert.ok(message);
  
  assert.is(
    message.textContent.trim(),
    'Have a lovely day!',
  );
});


test('Client generates DOM with current datetime', (env) => {
  const { hydrated } = env;
  const time = hydrated.getElementById('time');
  
  assert.ok(time);
  
  assert.is.not(
    time.textContent.trim(),
    'The time is now 00:00:00 on 01/01/00.',
  );
});


test('Assets copied to dist', () => {
  access(resolve(dist, 'something.txt'));
});

export default test;
