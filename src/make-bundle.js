import { rollup } from 'rollup';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import nodeResolve from '@rollup/plugin-node-resolve';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';

import babelConfig from './babel-config.js';


const makeBundle = (input, {
  ssr = false,
  development = false,
  transpile = !development,
  cssOutput = false,
  rollupInputOptions = {},
  rollupInputPlugins = [],
  svelteOptions = {},
  sveltePreprocess = {},
  terserOptions = {},
  ...babelConfigOptions,
} = {}) => rollup({
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
      css: (
        cssOutput
          ? (css) => { css.write(cssOutput, development); }
          : false
      ),
      hydratable: true,
      ...svelteOptions,
    }),
    rollupInputPlugins,
    nodeResolve.nodeResolve({
      browser: true,
      dedupe: ['svelte'],
    }),
    commonjs(),
    (!ssr && transpile)
      ? babel.babel(babelConfig(babelConfigOptions))
      : [],
    (!ssr && !development)
      ? terser(terserOptions)
      : [],
  ),
  ...rollupInputOptions,
});


export default makeBundle;
