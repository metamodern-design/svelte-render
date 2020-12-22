import { resolve } from 'path';
import { existsSync, rmSync } from 'fs';
import { readFile, writeFile, copyFile } from 'fs/promises';
import { uid } from 'uid';

import { makeBundle } from './make-bundle.js';
import { renderHtml } from './render-html.js';
import { runParallel } from './run-parallel.js';


export const render = async (context, {
  src = 'src',
  assets = 'assets',
  dist = 'dist',
  entry = 'index.svelte',
  client = 'client.js',
  noCss = false,
  development = false,
  before,
  onRender,
  after,
  ...options
} = {}) => {
  const args = {
    src, assets, dist, entry, client, development, noCss, ...options,
  };

  const buildId = uid(6);
  const asyncTasks1 = [];
  let cache = false;

  const cssOutput = (
    noCss
      ? false
      : `style-${buildId}.css`
  );

  if (before) {
    await before(context, args);
  }

  if (client) {
    asyncTasks1.push(['generateClientScript', async () => {
      const clientInput = resolve(context, src, client);
      const clientOutput = resolve(context, dist, `client-${buildId}.js`);

      const clientBundle = await makeBundle(clientInput, {
        ssr: false,
        development,
        cssOutput,
        ...options,
      });

      await clientBundle.write({
        format: 'iife',
        file: clientOutput,
      });
      
      await clientBundle.close();
    }]);
  }

  if (!development) {
    cache = resolve(context, `./.svelte-render/entry-${buildId}.js`);

    asyncTasks1.push(['generateEntryComponent', async () => {
      const entryInput = resolve(context, src, entry);

      const entryBundle = await makeBundle(entryInput, {
        ssr: true,
        cssOutput: client ? false : cssOutput,
        development,
        ...options,
      });

      await entryBundle.write({
        format: 'es',
        file: cache,
      });
      
      await entryBundle.close();

      return (await import(cache)).default;
    }]);
  }


  asyncTasks1.push(['readCustomTemplate', async () => {
    const customTemplate = resolve(context, src, 'template.html');

    if (existsSync(customTemplate)) {
      return readFile(customTemplate, 'utf8');
    }

    return false;
  }]);

  const taskResults = await runParallel(asyncTasks1);
  const template = taskResults.get('readCustomTemplate');
  const component = taskResults.get('generateEntryComponent');

  const asyncTasks2 = [];

  asyncTasks2.push(['generateHtml', async () => {
    const htmlOutput = resolve(context, dist, 'index.html');

    const htmlString = renderHtml({
      buildId,
      template,
      component,
      noCss,
      noClient: !client,
    });

    await writeFile(htmlOutput, htmlString);
  }]);

  const assetsDir = resolve(context, assets);
  
  if (existsSync(assetsDir)) {
    const assetsFilenames = await readdir(assetsDir);
    assetsFilenames.forEach((name) => {
      asyncTasks2.push([`copy:${name}`, async () => {
        await copyFile(
          resolve(assetsDir, name),
          resolve(context, dist, name),
        );
      }]);
    }); 
  }

  if (onRender) {
    asyncTasks2.push(['onRender', async () => {
      await onRender(context, args);
    }]);
  }

  await runParallel(asyncTasks2);

  if (after) {
    await after(context, args);
  }
  
  if (cache) {
    rmSync(cache, { force: true });
  }

  return 0;
};
