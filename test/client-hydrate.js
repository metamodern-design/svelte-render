import path from 'path';
import util from 'util';

import test from 'ava';
import del from 'del';
import fs from 'fs-extra';
import jsdom from 'jsdom';

import render from '../dist/esm.js';


const { JSDOM } = jsdom;

const context = path.resolve(process.cwd(), 'test');
const src = path.resolve(context, 'fixtures/src');
const dist = path.resolve(context, 'client-hydrate');
const assets = path.resolve(context, 'fixtures/assets');


test.before(async (t) => {
  await render(context, { src, dist, assets });

  const html = await fs.readFile(
    path.resolve(dist, 'index.html'),
    'utf8',
  );
  
  const scriptTagStart = html.indexOf('<script src="client-');
  const fileNameEnd = html.indexOf('"></script>');
  
  const fileName = html.slice(scriptTagStart + 13, fileNameEnd);
  const fullPath = path.resolve(dist, fileName);
  
  const scriptInserted = html.replace(fileName, `file://${fullPath}`);
  
  const dom = new JSDOM(scriptInserted, {
    runScripts: "dangerously",
    resources: "usable",
  });
  
  await util.promisify(setTimeout)(3000);
  
  t.context.hydrated = dom.window.document;
});


test.after.always(async () => {
  await del(dist);
});


test('SSR loads with hello world', async (t) => {
  const { hydrated } = t.context;
 
  t.is(
    hydrated.getElementById('hello').textContent.trim(),
    'Hello, World!',
  );
});


test('Client hydrates with assigned message prop', async (t) => {
  const { hydrated } = t.context;
  
  t.is(
    hydrated.getElementById('message').textContent.trim(),
    'Have a lovely day!',
  );
});


test('Client hydrates with current datetime', async (t) => {
  const { hydrated } = t.context;
  
  t.not(
    hydrated.getElementById('time').textContent.trim(),
    'The time is now 00:00:00 on 01/01/00.',
  );
});
