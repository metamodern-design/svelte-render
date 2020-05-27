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
    ],
    plugins,
    external,
  },
  {
    input: 'src/cli.js',
    output: [
      { file: pkg.cli, format: 'es' },
    ],
    plugins: [
      preserveShebangs(),
      ...plugins,
    ],
    external,
  },
];
