import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import { preserveShebangs } from 'rollup-plugin-preserve-shebangs';
import pkg from './package.json';


const plugins = [
  nodeResolve({ preferBuiltins: true }),
  commonjs(),
];


const external = [].concat(
  'path',
  'os',
  Object.keys(pkg.dependencies),
);


export default [
  {
    input: 'src/index.js',
    output: [
      { file: pkg.module, format: 'es' },
      { file: pkg.main, format: 'cjs' },
    ],
    plugins,
    external,
  },
  {
    input: 'src/cli.js',
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
