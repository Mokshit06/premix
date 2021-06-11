const esbuild = require('esbuild');

/** @type {esbuild.Plugin} */
const urlPlugin = {
  name: 'url-loader',
  setup(build) {
    const path = require('path');

    build.onResolve({ filter: /^url:/ }, args => {
      const filePath = path.join(
        args.resolveDir,
        args.path.replace(/^url:/, '')
      );

      return {
        path: filePath,
        namespace: 'url',
      };
    });

    build.onLoad({ filter: /.*/, namespace: 'url' }, async args => {
      const { plugins, stdin, ...options } = build.initialOptions;

      const result = await esbuild.build({
        ...options,
        entryPoints: [args.path],
        write: false,
        sourcemap: 'inline',
      });

      return {
        contents: result.outputFiles[0].text,
        loader: 'file',
        watchFiles: [args.path],
      };
    });
  },
};

module.exports = urlPlugin;
