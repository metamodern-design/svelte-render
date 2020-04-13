import path from 'path';
import fs from 'fs-extra';
import esmConfig from 'esm-config';
import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import svelte from 'rollup-plugin-svelte';
import terser from 'rollup-plugin-terser';

const babelConfig = ({
  targets = '> 1.5% in US, Firefox ESR, not dead',
  babelOptions = {},
  babelPlugins = [],
  babelPresets = [['@babel/preset-env', {
    targets,
    corejs: 3,
    useBuiltIns: 'usage',
  }]],
} = {}) => ({
  plugins: babelPlugins,
  presets: babelPresets,
  ...babelOptions,
  exclude: [].concat(/\/core-js\//, babelOptions.exclude || []),
});

const makeBundle = (input, {
  generate = 'dom',
  mode = 'production',
  transpile = (mode === 'production'),
  rollupInputOptions = {},
  rollupInputPlugins = [],
  svelteOptions = {},
  sveltePreprocess = {},
  terserOptions = {},
  browserslistTargets,
  babelOptions,
  babelPlugins,
  babelPresets,
} = {}) => rollup({
  input,
  plugins: [].concat(
    replace({
      'process.browser': (generate === 'dom'),
      'process.env.NODE_ENV': JSON.stringify(mode),
    }),
    svelte({
      generate,
      preprocess: sveltePreprocess,
      dev: (mode !== 'production'),
      hydratable: (mode === 'production'),
      css: (generate === 'dom')
        ? (css) => {
          css.write('./static/global.css', mode !== 'production');
        }
        : false,
      ...svelteOptions,
    }),
    rollupInputPlugins,
    resolve({
      browser: (generate === 'dom'),
      dedupe: ['svelte'],
    }),
    commonjs(),
    (transpile && generate === 'dom')
      ? babel(babelConfig(
        browserslistTargets))
      : [],
    (mode === 'production' && generate === 'dom')
      ? terser.terser(terserOptions)
      : [],
  ),
  ...rollupInputOptions,
});

const renderHtml = (component, template) => {
  const { head, html } = component.render();

  return (
    template
      .replace('%svelte:head%', head)
      .replace('%svelte:html%', html)
  );
};

const svelteRender = async (context, {
  src = 'src',
  dist = 'dist',
  index = 'index.svelte',
  client = 'client.js',
  mode = 'production',
  ...options
} = {}) => {
  if (mode === 'production') {
    const indexBundle = await makeBundle(
      path.resolve(context, src, index),
      { generate: 'ssr', mode, ...options },
    );

    const cache = path.resolve(context, './.svelte-render/ssr.js');

    await indexBundle.write({
      format: 'es',
      file: cache,
    });

    let component;
    let template;

    [component, template] = await Promise.all([
      esmConfig(cache),
      fs.readFile(path.resolve(context, src, 'template.html'), 'utf8'),
    ]);

    await fs.outputFile(
      path.resolve(context, dist, 'index.html'),
      renderHtml(component, template),
    );
  } // else generate minimal index.html

  const clientBundle = await makeBundle(
    path.resolve(context, src, client),
    { generate: 'dom', mode, ...options },
  );

  await clientBundle.write({
    format: 'iife',
    file: path.resolve(context, dist, client),
  });
};

export default svelteRender;
