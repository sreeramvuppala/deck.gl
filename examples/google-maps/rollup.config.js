import nodeResolve from 'rollup-plugin-node-resolve';
import commonJs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import serve from 'rollup-plugin-serve';

export default {
  entry: 'app.js',
  format: 'amd',
  moduleName: 'deckgl-rollup-example',
  plugins: [
    nodeResolve(),
    buble({objectAssign: 'Object.assign', transforms: {dangerousForOf: true}}),
    commonJs(),
    serve({contentBase: './'})
  ]
};
