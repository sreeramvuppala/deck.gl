import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import ignore from 'rollup-plugin-ignore';
import nodeResolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import commonJs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import serve from 'rollup-plugin-serve';

// TODO - These fail because rollup doesn't understand babel transpiled "export *"
const DECKGL_EXPORTS = [
  'ArcLayer',
  'ChoroplethLayer',
  'LineLayer',
  'ScatterplotLayer',
  'ScreenGridLayer',
  'ArcLayer64',
  'ChoroplethLayer64',
  'LineLayer64',
  'ScatterplotLayer64',
  'ExtrudedChoroplethLayer64',
  'EnhancedChoroplethLayer'
];

export default {
  format: 'iife',
  sourceMap: 'inline',
  context: 'window',
  moduleContext: {
    'webgl-debug': 'window'
  },
  legacy: true,
  plugins: [
    ignore(['node-zlib-backport', 'fs', 'webgl-debug']),
    nodeResolve({
      preferBuiltins: false,
      browser: true,
      jsnext: true,
      main: true
    }),
    json(),
    builtins(),
    commonJs({
      include: 'node_modules/**',
      namedExports: {
        react: ['Children', 'Component', 'PropTypes', 'createElement'],
        'react-stats': ['FPSStats'],
        'deck.gl/experimental': ['ReflectionEffect'],
        'deck.gl': DECKGL_EXPORTS,
        'node_modules/process/browser.js': ['nextTick'],
        events: ['EventEmitter']
      }
    }),
    buble({
      exclude: 'node_modules/**',
      target: {
        chrome: 50
      },
      objectAssign: 'Object.assign',
      transforms: {
        dangerousForOf: false
      }
    }),
    globals(),
    serve({
      open: true,
      contentBase: './'
    })
  ],
  onwarn(message) {
    if (/external dependency/.test(message)) {
      process.stdout.write('.'); // eslint-disable-line
    } else {
      console.error(message); // eslint-disable-line
    }
  }
};
