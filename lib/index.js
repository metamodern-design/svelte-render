import { resolve, dirname } from 'path';
import { existsSync } from 'fs';
import {
  mkdir, rm, readFile, writeFile, copyFile,
} from 'fs/promises';

import { totalist } from 'totalist';
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
  const asyncTasks = [];

  // make sure `dist` exists
  await mkdir(resolve(context, dist), { recursive: true });

  // run `before` hook
  if (before) {
    await before(context, args);
  }

  // push build `client` script
  if (client) {
    asyncTasks.push(['generateClientScript', async () => {
      const clientInput = resolve(context, src, client);
      const clientOutput = resolve(context, dist, `client-${buildId}.js`);

      const clientBundle = await makeBundle(clientInput, {
        development,
        ssr: false,
        cssOutput: noCss ? false : `style-${buildId}.css`,
        ...options,
      });

      await clientBundle.write({
        format: 'iife',
        file: clientOutput,
      });

      await clientBundle.close();
    }]);
  }

  // push build `entry` script (for pre-rendered HTML in production)
  if (!development) {
    asyncTasks.push(['generateEntryComponent', async () => {
      const entryInput = resolve(context, src, entry);
      const cache = resolve(context, `./.svelte-render/entry-${buildId}.js`);

      const entryBundle = await makeBundle(entryInput, {
        development: false,
        ssr: true,
        cssOutput: false,
        ...options,
      });

      await entryBundle.write({
        format: 'es',
        file: cache,
      });

      const component = (await import(cache)).default;

      await Promise.all([
        entryBundle.close(),
        rm(cache, { force: true }),
      ]);

      return component;
    }]);
  }

  // push check for custom HTML template
  asyncTasks.push(['readCustomTemplate', async () => {
    const customTemplate = resolve(context, src, 'template.html');

    if (existsSync(customTemplate)) {
      return readFile(customTemplate, 'utf8');
    }

    return false;
  }]);

  // push copy `assets` directory to `dist`
  const assetsDir = resolve(context, assets);

  if (existsSync(assetsDir)) {
    asyncTasks.push(['copyAssetsDir', async () => {
      const copyEach = async (filename, srcPath) => {
        const destPath = resolve(context, dist, filename);
        await mkdir(dirname(destPath), { recursive: true });
        await copyFile(srcPath, destPath);
      };

      await totalist(assetsDir, copyEach);
    }]);
  }

  // push `onRender` hook
  if (onRender) {
    asyncTasks.push(['onRender', async () => {
      await onRender(context, args);
    }]);
  }

  // run `asyncTasks` in parallel
  const taskResults = await runParallel(asyncTasks);
  const template = taskResults.get('readCustomTemplate');
  const component = taskResults.get('generateEntryComponent');

  // output index.html (with pre-rendered HTML in production)
  const htmlOutput = resolve(context, dist, 'index.html');

  const htmlString = renderHtml({
    buildId,
    template,
    component,
    noCss,
    noClient: !client,
  });

  await writeFile(htmlOutput, htmlString);

  // run `after` hook
  if (after) {
    await after(context, args);
  }

  return 0;
};
