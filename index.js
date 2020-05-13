import path from 'path';
import fs from 'fs-extra';
import esmConfig from 'esm-config';

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
  if (!development) {
    const [entryBundle, clientBundle] = await Promise.all([
      makeBundle(
        path.resolve(context, src, entry),
        { ssr: true, development, ...options },
      ),
      makeBundle(
        path.resolve(context, src, client),
        { ssr: false, development, ...options },
      ),
    ]);

    const cache = path.resolve(context, './.svelte-render/entry.js');

    await Promise.all([
      entryBundle.write({
        format: 'es',
        file: cache,
      }),
      clientBundle.write({
        format: 'iife',
        file: path.resolve(context, dist, client),
      }),
    ]);

    const [component, template] = await Promise.all([
      esmConfig(cache),
      fs.readFile(path.resolve(context, src, 'template.html'), 'utf8'),
    ]);

    await fs.outputFile(
      path.resolve(context, dist, 'index.html'),
      renderHtml(component, template),
    );
  } else {
    const clientBundle = await makeBundle(
      path.resolve(context, src, client),
      { ssr: false, development, ...options },
    );

    await clientBundle.write({
      format: 'iife',
      file: path.resolve(context, dist, client),
    });

    // else generate minimal index.html
  }
};


export default svelteRender;
