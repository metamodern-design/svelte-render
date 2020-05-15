import path from 'path';

import test from 'ava';
import del from 'del';
import fs from 'fs-extra';
import jsdom from 'jsdom';

import render from '../dist/esm.js';


const { JSDOM } = jsdom;

const context = path.resolve(process.cwd(), 'test');
const src = path.resolve(process.cwd(), 'test/fixtures');
const dist = path.resolve(process.cwd(), 'test/ssr-only');
const assets = path.resolve(process.cwd(), 'test/ssr-only-assets');


test.before(async (t) => {
  await render(context, { src, dist, assets, client: false });
  
  const html = await fs.readFile(
    path.resolve(dist, 'index.html'),
    'utf8',
  );
  
  const dom = new JSDOM(html);
  
  t.context.ssr = dom.window.document;
});


test.after.always(async () => {
  await del([dist, assets]);
});


test('SSR loads with hello world', async (t) => {
  const { ssr } = t.context;
 
  t.is(
    ssr.getElementById('hello').textContent.trim(),
    'Hello, World!',
  );
});


test('SSR loads with default message parameter', async (t) => {
  const { ssr } = t.context;
  
  t.is(
    ssr.getElementById('message').textContent.trim(),
    'Have a nice day!',
  );
});


test('SSR loads with default date parameter', async (t) => {
  const { ssr } = t.context;
  
  t.is(
    ssr.getElementById('time').textContent.trim(),
    'The time is now 00:00:00 on 01/01/00.',
  );
});
