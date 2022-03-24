import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import babel from '@rollup/plugin-babel';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/cradio.js',
    name: 'CRadio',
    format: 'umd',
    sourcemap: true,
  },
  plugins: [
    postcss({
      // extract: true,
    }),
    nodeResolve(),
    commonjs(), // 这样 Rollup 能转换 `ms` 为一个ES模块
    babel({
      babelHelpers: 'runtime', // 输入时的词法转换
      exclude: '**/node_modules/**',
    }),
    livereload(),
    serve({
      open: true,
      port: 80,
      contentBase: '',
    }),
  ],
};
