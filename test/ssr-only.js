import { access, rmdir } from 'fs/promises';
import { resolve } from 'path';

import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import jsdom from 'jsdom';

import render from '../lib/index.js';


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
  
  env.ssr = dom.window.document;
});


test.after.each(async () => {
  await rmdir(dist, { recursive: true });
});


test('Always passes', async () => {
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


test('Assets copied to dist', async () => {
  assert.not.throws(await access(resolve(dist, 'something.txt')));
});

export default test;
