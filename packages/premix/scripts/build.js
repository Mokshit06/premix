const esbuild = require('esbuild');
const pkg = require('../package.json');

const external = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.devDependencies),
];

Promise.all([
  esbuild.build({
    bundle: true,
    entryPoints: [
      './src/index.tsx',
      './src/server.tsx',
      './src/build/babel/transform.js',
    ],
    entryNames: '[name]',
    external,
    minify: false,
    outdir: 'dist/premix',
    platform: 'node',
    allowOverwrite: true,
    watch: true,
    target: ['chrome58', 'node12'],
    inject: ['./src/build/react-shim.js'],
  }),
  esbuild.build({
    bundle: true,
    entryPoints: ['./src/bin/premix.ts'],
    external,
    minify: false,
    outdir: 'dist/bin',
    platform: 'node',
    watch: true,
    target: ['node12'],
  }),
]).catch(err => process.exit(1));
