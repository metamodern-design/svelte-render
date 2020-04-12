import { rollup } from 'rollup';

import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';

import babelConfig from './babel-config.js';


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
        browserslistTargets,
        babelOptions,
        babelPlugins,
        babelPresets,
      ))
      : [],
    (mode === 'production' && generate === 'dom')
      ? terser(terserOptions)
      : [],
  ),
  ...rollupInputOptions,
});


export default makeBundle;
