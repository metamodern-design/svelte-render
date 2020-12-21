import path from 'path';
import util from 'util';

import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import del from 'del';
import fs from 'fs-extra';
import jsdom from 'jsdom';

import render from '../dist/index.js';


const { JSDOM } = jsdom;

const context = path.resolve(process.cwd(), 'test');
const assets = path.resolve(context, 'fixtures/assets');
const src = path.resolve(context, 'fixtures/src');
const dist = path.resolve(context, 'development');

const test = suite('Development');


test.before(async (t) => {
  await render(context, { src, dist, assets, development: true });

  const html = await fs.readFile(
    path.resolve(dist, 'index.html'),
    'utf8',
  );
  
  const scriptTagStart = html.indexOf('<script src="/client-');
  const fileNameEnd = html.indexOf('"></script>');
  
  const fileName = html.slice(scriptTagStart + 14, fileNameEnd);
  const fullPath = path.resolve(dist, fileName);
  
  const scriptInserted = html.replace(`/${fileName}`, `file://${fullPath}`);
  
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


test('Client generates DOM with hello world', async (t) => {
  const { hydrated } = t.context;
  const hello = hydrated.getElementById('hello');
  
  t.ok(hello);
 
  t.is(
    hello.textContent.trim(),
    'Hello, World!',
  );
});


test('Client generates DOM with assigned message prop', async (t) => {
  const { hydrated } = t.context;
  const message = hydrated.getElementById('message');
  
  t.ok(message);
  
  t.is(
    message.textContent.trim(),
    'Have a lovely day!',
  );
});


test('Client generates DOM with current datetime', async (t) => {
  const { hydrated } = t.context;
  const time = hydrated.getElementById('time');
  
  t.ok(time);
  
  t.is.not(
    time.textContent.trim(),
    'The time is now 00:00:00 on 01/01/00.',
  );
});


test('Assets copied to dist', async (t) => {
  t.ok(await fs.pathExists(path.resolve(dist, 'something.txt')));
});
