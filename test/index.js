import path from 'path';

import test from 'ava';
import del from 'del';
import fs from 'fs-extra';
import jsdom from 'jsdom';

import render from '../dist/esm.js';


const { JSDOM } = jsdom;

const context = path.resolve(process.cwd(), 'test');


test.before(async () => {
  await render(context, {
  	src: path.resolve(context, 'fixtures'),
  });
});


test.after(async () => {
  await del(path.resolve(context, './dist'));
});


test('SSR document loads', async (t) => {
  const html = await fs.readFile(
  	path.resolve(context, 'dist/index.html'),
  	'utf8',
  );
  
  const { document } = (new JSDOM(html)).window;
 
  t.is(
    document.getElementById('hello').textContent.trim(),
    'Hello, World!',
  );
});
