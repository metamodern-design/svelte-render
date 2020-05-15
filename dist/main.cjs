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
  targets = '> 1.5% in US, Firefox ESR, not ie <= 11, not dead',
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
  ssr = false,
  development = false,
  transpile = !development,
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
      'process.browser': !ssr,
      'process.env.NODE_ENV': (development ? 'development' : 'production'),
    }),
    svelte({
      generate: (ssr ? 'ssr' : 'dom'),
      preprocess: sveltePreprocess,
      dev: development,
      hydratable: !development,
      css: (
        ssr
          ? false
          : (css) => { css.write('./static/global.css', development); }
      ),
      ...svelteOptions,
    }),
    rollupInputPlugins,
    resolve({
      browser: !ssr,
      dedupe: ['svelte'],
    }),
    commonjs(),
    (!ssr && transpile)
      ? babel(babelConfig(
        browserslistTargets))
      : [],
    (!ssr && !development)
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
  entry = 'index.svelte',
  client = 'client.js',
  publicUrl = '',
  development = false,
  ...options
} = {}) => {
  const cache = path.resolve(context, './.svelte-render/entry.js');
  
  const generateHtml = async () => {
    const [component, template] = await Promise.all([
      esmConfig(cache),
      fs.readFile(path.resolve(context, src, 'template.html'), 'utf8'),
    ]);

    await fs.outputFile(
      path.resolve(context, dist, 'index.html'),
      renderHtml(component, template),
    );
    
    return 1;
  };

  if (!client) {
    const entryBundle = await makeBundle(
      path.resolve(context, src, entry),
      { ssr: true, development, ...options },
    );

    await entryBundle.write({
      format: 'es',
      file: cache,
    });
    
    return generateHtml();
  } 
  
  if (development) {
    const clientBundle = await makeBundle(
      path.resolve(context, src, client),
      { ssr: false, development, ...options },
    );

    await clientBundle.write({
      format: 'iife',
      file: path.resolve(context, dist, client),
    });
    
    return 1;
  }
  
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

  return 1;
};

module.exports = svelteRender;
