import { rollup } from 'rollup';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import svelte from 'rollup-plugin-svelte';
import css from 'rollup-plugin-css-only';
import { terser } from 'rollup-plugin-terser';

import { babelConfig } from './babel-config.js';


export const makeBundle = (input, {
  ssr = false,
  development = false,
  transpile = !development,
  cssOutput = false,
  rollupInputOptions = {},
  rollupInputPlugins = [],
  compilerOptions = {},
  sveltePreprocess = {},
  svelteOptions = {},
  terserOptions = {},
  ...babelConfigOptions
} = {}) => rollup({
  input,
  plugins: [].concat(
    replace({
      'process.browser': !ssr,
      'process.env.NODE_ENV': (development ? 'development' : 'production'),
    }),
    svelte({
      preprocess: sveltePreprocess,
      compilerOptions: {
        generate: (ssr ? 'ssr' : 'dom'),
        dev: development,
        hydratable: true,
        ...compilerOptions,
      },
      ...svelteOptions,
    }),
    css({ output: cssOutput }),
    rollupInputPlugins,
    nodeResolve({
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
