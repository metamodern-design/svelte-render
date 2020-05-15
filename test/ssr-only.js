import path from 'path';

import test from 'ava';
import del from 'del';
import fs from 'fs-extra';
import jsdom from 'jsdom';

import render from '../dist/esm.js';


const { JSDOM } = jsdom;

const context = path.resolve(process.cwd(), 'test');
const src = path.resolve(process.cwd(), 'test/fixtures');
const dist = path.resolve(process.cwd(), 'test/dist');


test.before(async (t) => {
  await render(context, { 
    src,
    client: false,
  });
  
  const html = await fs.readFile(
    path.resolve(dist, 'index.html'),
    'utf8',
  );
  
  const dom = new JSDOM(html);
  
  t.context.document = dom.window.document;
});


/*
test.after(async () => {
  await del([
    path.resolve(context, './dist'),
    path.resolve(context, './.svelte-render'),
  ]);
});
*/


test('SSR document loads', async (t) => {
  const { document } = t.context;
 
  t.is(
    document.getElementById('hello').textContent.trim(),
    'Hello, World!',
  );
  
  t.is(
    document.getElementById('message').textContent.trim(),
    'Have a nice day!',
  );
  
  t.is(
    document.getElementById('time').textContent.trim(),
    'The time is now 00:00:00',
  );
});
