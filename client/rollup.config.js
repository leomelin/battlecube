import typescript from 'rollup-plugin-typescript';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import json from 'rollup-plugin-json';
import postcss from 'rollup-plugin-postcss';
import nested from 'postcss-nested';
import cssnano from 'cssnano';
import uglify from 'rollup-plugin-uglify';
import {minify} from 'uglify-es';

// If you do not want to use Typescript for the client app, you can use the plugin rollup-plugin-buble or rollup plugin-babel
// with the form it is called buble({ jsx: 'h' }) in plugins - setting the pragma also allows you to use jsx instead of h

const dev = !!process.env.ROLLUP_WATCH;

const BUILD = dev ? 'DEV' : 'PROD';
console.log(`Build environment: ${BUILD}`);

const devCssConfig = {
  plugins: [nested()]
};

const prodCssConfig = {
  plugins: [nested(), cssnano()],
  extract: 'client/static/styles.css',
  sourceMap: false
};

const cssConfig = dev ? devCssConfig : prodCssConfig;

export default {
  input: 'client/src/client.ts',
  name: 'Battlecube',
  output: {
    file: 'client/static/client.js',
    format: 'iife'
  },
  plugins: [
    postcss(cssConfig),
    resolve({
      module: true,
      browser: true,
      customResolveOptions: {
        moduleDirectory: 'node_modules'
      }
    }),
    commonjs(),
    json(),
    typescript({typescript: require('typescript')}),
    dev && livereload('client/static'),
    dev &&
      serve({
        contentBase: ['client/static'],
        historyApiFallback: true,
        port: 8080,
        open: true
      }),
    !dev && uglify({}, minify)
  ].filter(v => v)
};
