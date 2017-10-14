import typescript from 'rollup-plugin-typescript'
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
import json from 'rollup-plugin-json'
import postcss from 'rollup-plugin-postcss'
import nested from 'postcss-nested'

// If you do not want to use Typescript for the client app, you can use the plugin rollup-plugin-buble or rollup plugin-babel
// with the form it is called buble({ jsx: 'h' }) in plugins - setting the pragma also allows you to use jsx instead of h

export default {
  input: 'client/src/client.ts',
  name: 'Battlecube',
  output: {
    file: 'client/static/client.js',
    format: 'iife',
  },
  plugins: [
    postcss({ plugins: [nested()] }),
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
    livereload('client/static'),
    serve({
      contentBase: ['client/static'],
      historyApiFallback: true,
      port: 8080,
      open: true
    })
  ]
}
