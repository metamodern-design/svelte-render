import path from 'path';
import fs from 'fs-extra';

import del from 'del';
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
      : path.resolve(context, dist, `style-${buildId}.css`)
  );

  if (before) {
    await before(context, args);
  }

  if (client) {
    asyncTasks1.push(['generateClientScript', async () => {
      const clientInput = path.resolve(context, src, client);
      const clientOutput = path.resolve(context, dist, `client-${buildId}.js`);

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
    }]);
  }

  if (!development) {
    cache = path.resolve(context, `./.svelte-render/entry-${buildId}.js`);

    asyncTasks1.push(['generateEntryComponent', async () => {
      const entryInput = path.resolve(context, src, entry);

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

      return (await import(cache)).default;
    }]);
  }


  asyncTasks1.push(['readCustomTemplate', async () => {
    const customTemplate = path.resolve(context, src, 'template.html');

    if (await fs.pathExists(customTemplate)) {
      return fs.readFile(customTemplate, 'utf8');
    }

    return false;
  }]);

  const taskResults = await runParallel(asyncTasks1);
  const template = taskResults.get('readCustomTemplate');
  const component = taskResults.get('generateEntryComponent');

  const asyncTasks2 = [];

  asyncTasks2.push(['generateHtml', async () => {
    const htmlOutput = path.resolve(context, dist, 'index.html');

    const htmlString = renderHtml({
      buildId,
      template,
      component,
      noCss,
      noClient: !client,
    });

    await fs.outputFile(htmlOutput, htmlString);
  }]);

  asyncTasks2.push(['copyAssets', async () => {
    const assetsDir = path.resolve(context, assets);

    if (await fs.pathExists(assetsDir)) {
      await fs.copy(
        assetsDir,
        path.resolve(context, dist),
      );
    }
  }]);

  if (onRender) {
    asyncTasks2.push(['onRender', async () => {
      await onRender(context, args);
    }]);
  }

  if (cache) {
    asyncTasks2.push(['deleteCache', async () => {
      await del(cache);
    }]);
  }

  await runParallel(asyncTasks2);

  if (after) {
    await after(context, args);
  }

  return 0;
};
