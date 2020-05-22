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
  noStyle = false,
  ...options
} = {}) => {
  const buildId = uid(6);
  let cache = null;

  let cssOutput = (
    noStyle
      ? null
      : path.resolve(context, dist, `style-${buildId}.css`)
  );

  if (client) {
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

    cssOutput = null;
  }

  let template = null;
  let component = null;

  const customTemplate = path.resolve(context, src, 'template.html');

  if (await fs.pathExists(customTemplate)) {
    template = await fs.readFile(customTemplate, 'utf8');
  }

  if (!development) {
    const entryInput = path.resolve(context, src, entry);
    cache = path.resolve(context, `./.svelte-render/entry-${buildId}.js`);

    const entryBundle = await makeBundle(entryInput, {
      ssr: true,
      development,
      cssOutput,
      ...options,
    });

    await entryBundle.write({
      format: 'es',
      file: cache,
    });

    component = await esmConfig(cache);
  }

  const htmlOutput = path.resolve(context, dist, 'index.html');

  const htmlString = renderHtml({
    buildId,
    template,
    component,
    noStyle,
    noClient: !client,
  });

  await fs.outputFile(htmlOutput, htmlString);

  if (cache) {
    await del(cache);
  }

  const assetsDir = path.resolve(context, 'assets');

  if (await fs.pathExists(assetsDir)) {
    await fs.copy(
      assetsDir,
      path.resolve(context, dist),
    );
  }

  return 0;
};


export default svelteRender;
