const esbuild = require('esbuild');

/** @type {esbuild.Plugin} */
const workerPlugin = {
  name: 'worker-plugin',
  setup(build) {
    const path = require('path');

    build.onResolve({ filter: /^worker:/ }, args => {
      const filePath = path.join(
        args.resolveDir,
        args.path.replace(/^worker:/, '')
      );

      return {
        path: filePath,
        namespace: 'worker',
      };
    });

    build.onLoad({ filter: /.*/, namespace: 'worker' }, async args => {
      const result = await esbuild.build({
        entryPoints: [args.path],
        bundle: true,
        write: false,
      });

      return {
        contents: `
        export default function WorkerWrapper() {
          return new Worker(${JSON.stringify(
            `data:application/javascript;base64,${Buffer.from(
              result.outputFiles[0].text
            ).toString('base64')}`
          )})
        }
        `,
        loader: 'js',
        watchFiles: [`${args.path}.ts`, `${args.path}.js`],
      };
    });
  },
};

module.exports = workerPlugin;
