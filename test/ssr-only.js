import path from 'path';

import test from 'ava';
import del from 'del';
import fs from 'fs-extra';
import jsdom from 'jsdom';

import render from '../dist/esm.js';


const { JSDOM } = jsdom;

const context = path.resolve(process.cwd(), 'test');
const src = path.resolve(context, 'fixtures/src');
const assets = path.resolve(context, 'fixtures/assets');
const dist = path.resolve(context, 'ssr-only');


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
  await del(dist);
});


test('SSR loads with hello world', (t) => {
  const { ssr } = t.context;
  const hello = ssr.getElementById('hello');
 
  t.is(
    hello.textContent.trim(),
    'Hello, World!',
  );
});


test('SSR loads with default message parameter', (t) => {
  const { ssr } = t.context;
  const message = ssr.getElementById('message');
  
  t.truthy(message);
  
  t.is(
    message.textContent.trim(),
    'Have a nice day!',
  );
});


test('SSR loads with default date parameter', (t) => {
  const { ssr } = t.context;
  const time = ssr.getElementById('time');
  
  t.truthy(time);
  
  t.is(
    time.textContent.trim(),
    'The time is now 00:00:00 on 01/01/00.',
  );
});


test('Assets copied to dist', async (t) => {
  t.true(await fs.pathExists(path.resolve(dist, 'something.txt')));
});
