import path from 'path';
import fs from 'fs-extra';

import del from 'del';
import esmConfig from 'esm-config';
import uid from 'uid';

import makeBundle from './src/make-bundle.js';
import renderHtml from './src/render-html.js';


const svelteRender = async (context, {
  src = 'src',
  dist = 'dist',
  entry = 'index.svelte',
  client = 'client.js',
  development = false,
  ...options
} = {}) => {
  const buildId = uid(8);
  let cache = null;

  if (client) {
    const clientBundle = await makeBundle(
      path.resolve(context, src, client),
      {
        ssr: false, development, dist, ...options,
      },
    );

    await clientBundle.write({
      format: 'iife',
      file: path.resolve(context, dist, `client-${buildId}.js`),
    });
  }

  let template = null;
  let component = null;

  const customTemplate = path.resolve(context, src, 'template.html');

  if (fs.pathExists(customTemplate)) {
    template = await fs.readFile(customTemplate, 'utf8');
  }

  if (!development) {
    cache = path.resolve(context, `./.svelte-render/entry-${buildId}.js`);

    const entryBundle = await makeBundle(
      path.resolve(context, src, entry),
      {
        ssr: true, development, dist, ...options,
      },
    );

    await entryBundle.write({
      format: 'es',
      file: cache,
    });

    component = await esmConfig(cache);
  }

  await fs.outputFile(
    path.resolve(context, dist, 'index.html'),
    renderHtml(buildId, template, component),
  );

  if (cache) {
    await del(cache);
  }

  const assetsDir = path.resolve(context, 'assets');

  if (fs.pathExists(assetsDir)) {
    await fs.copy(
      assetsDir,
      path.resolve(context, dist),
    );
  }

  return 0;
};


export default svelteRender;
