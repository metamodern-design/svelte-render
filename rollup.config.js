import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import { preserveShebangs } from 'rollup-plugin-preserve-shebangs';
import pkg from './package.json';


const plugins = [
  nodeResolve(),
  commonjs(),
];


const external = [].concat(
  'path',
  Object.keys(pkg.dependencies),
);


export default [
  {
    input: 'index.js',
    output: [
      { file: pkg.module, format: 'es' },
      { file: pkg.main, format: 'cjs' },
    ],
    plugins,
    external,
  },
  {
    input: 'cli.js',
    output: [
      { file: pkg.cli, format: 'es' },
      { file: pkg.cliLegacy, format: 'cjs' },
    ],
    plugins: [
      preserveShebangs(),
      ...plugins,
    ],
    external,
  },
];
