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
  await render(context, { src });
  
  const html = await fs.readFile(
    path.resolve(dist, 'index.html'),
    'utf8',
  );
  
  const client = await fs.readFile(
    path.resolve(dist, 'client.js'),
    'utf8',
  );
  
  html.replace(
    '<script src="client.js"></script>',
    `<script>${client}</script>`,
  );
  
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
  });
  
  await fs.outputFile('test.html', dom.serialize()); 
  
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


test('SSR loads with hello world', async (t) => {
  const { document } = t.context;
 
  t.is(
    document.getElementById('hello').textContent.trim(),
    'Hello, World!',
  );
});


test('Client hydrates with assigned message prop', async (t) => {
  const { document } = t.context;
  
  t.is(
    document.getElementById('message').textContent.trim(),
    'Have a lovely day!',
  );
});


test('Client hydrates with current datetime', async (t) => {
  const { document } = t.context;
  
  t.not(
    document.getElementById('time').textContent.trim(),
    'The time is now 00:00:00 on 01/01/00.',
  );
});
