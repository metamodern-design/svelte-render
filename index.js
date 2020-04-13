import path from 'path';
import fs from 'fs-extra';
import esmConfig from 'esm-config';

import makeBundle from './src/make-bundle.js';
import renderHtml from './src/render-html.js';


const svelteRender = async (context, {
  src = 'src',
  dist = 'dist',
  ssr = 'index',
  client = 'client',
  mode = 'production',
  ...options
} = {}) => {
  if (mode === 'production') {
    const [ssrBundle, clientBundle] = await Promise.all([
      makeBundle(
        path.resolve(context, src, `${ssr}.svelte`),
        { generate: 'ssr', mode, ...options },
      ),
      makeBundle(
        path.resolve(context, src, `${client}.js`),
        { generate: 'dom', mode, ...options },
      ),
    ]);

    const cache = path.resolve(context, `./.svelte-render/${ssr}.js`);

    await Promise.all([
      ssrBundle.write({
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
      { generate: 'dom', mode, ...options },
    );

    await clientBundle.write({
      format: 'iife',
      file: path.resolve(context, dist, client),
    });

    // else generate minimal index.html
  }
};


export default svelteRender;
