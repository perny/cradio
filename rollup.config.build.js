import { nodeResolve } from '@rollup/plugin-node-resolve';
// import eslint from '@rollup/plugin-eslint';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default {
  input: 'src/index.js',
  output: {
    file: pkg.main,
    name: 'CRadio',
    format: 'umd',
    sourcemap: true,
    plugins: [
      terser({
        compress: {
          drop_console: true,
        },
      }),
    ],
  },
  plugins: [
    postcss({
      extract: true,
    }),
    nodeResolve(),
    commonjs(), // 这样 Rollup 能转换 `ms` 为一个ES模块
    babel({
      babelHelpers: 'runtime', // 输入时的词法转换
      exclude: '**/node_modules/**',
    }),
  ],
};
