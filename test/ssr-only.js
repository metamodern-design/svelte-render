import { existsSync, rmSync } from 'fs';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import jsdom from 'jsdom';

import { render } from '../lib/index.js';


const { JSDOM } = jsdom;

const context = resolve(process.cwd(), 'test');
const src = resolve(context, 'fixtures/src');
const assets = resolve(context, 'fixtures/assets');
const dist = resolve(context, 'ssr-only');

const test = suite('SSR Only');

test.before(async (env) => {
  await render(context, { src, dist, assets, client: false });
  
  const html = await readFile(
    resolve(dist, 'index.html'),
    'utf8',
  );
  
  const dom = new JSDOM(html);
  
  env.window = dom.window;
  env.ssr = dom.window.document;
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
  const { ssr } = env;
  const hello = ssr.getElementById('hello');
 
  assert.is(
    hello.textContent.trim(),
    'Hello, World!',
  );
});


test('SSR loads with default message parameter', (env) => {
  const { ssr } = env;
  const message = ssr.getElementById('message');
  
  assert.ok(message);
  
  assert.is(
    message.textContent.trim(),
    'Have a nice day!',
  );
});


test('SSR loads with default date parameter', (env) => {
  const { ssr } = env;
  const time = ssr.getElementById('time');
  
  assert.ok(time);
  
  assert.is(
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
