import path from 'path';

import test from 'ava';
import del from 'del';
import { JSDOM } from 'jsdom';

import render from '../dist/esm.js';


test.before(async () => {
  await render('./', { src: 'fixtures' });
});


test.after(async () => {
  await del(path.resolve(__dirname, './dist'));
});


test('SSR document loads', async (t) => {
  const { document } = await JSDOM.fromFile(
    path.resolve(__dirname, 'dist/index.html'),
  );

  t.is(
    document.getElementById('hello').textContent.trim(),
    'Hello, World!',
  );
});
