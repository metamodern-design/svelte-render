'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
var fs = _interopDefault(require('fs-extra'));
var esmConfig = _interopDefault(require('esm-config'));
var rollup = require('rollup');
var babel = _interopDefault(require('rollup-plugin-babel'));
var commonjs = _interopDefault(require('@rollup/plugin-commonjs'));
var replace = _interopDefault(require('@rollup/plugin-replace'));
var resolve = _interopDefault(require('@rollup/plugin-node-resolve'));
var svelte = _interopDefault(require('rollup-plugin-svelte'));
var terser = _interopDefault(require('rollup-plugin-terser'));

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
} = {}) => rollup.rollup({
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

    const [component, template] = await Promise.all([
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

module.exports = svelteRender;
