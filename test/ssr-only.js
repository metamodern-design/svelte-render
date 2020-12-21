import path from 'path';

import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import del from 'del';
import fs from 'fs-extra';
import jsdom from 'jsdom';

import render from '../lib/index.js';


const { JSDOM } = jsdom;

const context = path.resolve(process.cwd(), 'test');
const src = path.resolve(context, 'fixtures/src');
const assets = path.resolve(context, 'fixtures/assets');
const dist = path.resolve(context, 'ssr-only');

const test = suite('SSR Only');

test.before(async (env) => {
  await render(context, { src, dist, assets, client: false });
  
  const html = await fs.readFile(
    path.resolve(dist, 'index.html'),
    'utf8',
  );
  
  const dom = new JSDOM(html);
  
  env.ssr = dom.window.document;
});


test.after.each(async () => {
  await del(dist);
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


test('Assets copied to dist', async (env) => {
  assert7.ok(await fs.pathExists(path.resolve(dist, 'something.txt')));
});

export default test;
