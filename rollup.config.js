import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import pkg from './package.json';


export default [
  {
    input: 'index.js',
    external: Object.keys(pkg.dependencies),
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    plugins: [
      nodeResolve(),
      commonjs(),
    ],
  },
];
