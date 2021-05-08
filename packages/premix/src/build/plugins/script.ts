import { Plugin } from 'esbuild';

export const clientScriptPlugin: Plugin = {
  name: 'client-script',
  setup(build) {
    build.onLoad({ filter: /\.client\.(ts|js)$/ }, () => {
      return {
        contents: `module.exports = {}`,
        loader: 'js',
      };
    });
  },
};

export const serverScriptPlugin: Plugin = {
  name: 'server-script',
  setup(build) {
    build.onLoad({ filter: /\.server\.(ts|js)/ }, () => {
      return {
        contents: `module.exports = {}`,
        loader: 'js',
      };
    });
  },
};
