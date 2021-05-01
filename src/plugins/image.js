/** @type {import('esbuild').Plugin} */
const plugin = {
  name: 'image-loader',
  setup(build) {
    const path = require('path');
    const sharp = require('sharp');

    build.onResolve({ filter: /^img:/ }, args => {
      const filePath = path.join(
        args.resolveDir,
        args.path.replace(/^img:/, '')
      );

      return {
        path: filePath,
        namespace: 'image',
      };
    });

    build.onResolve({ filter: /^optimize:/ }, args => {
      const filePath = path.join(
        args.resolveDir,
        args.path.replace(/^optimize:/, '')
      );
      const { searchParams } = new URL(`https://example.com/${args.path}`);

      return {
        path: filePath.replace(/\?path=(.*)/, ''),
        namespace:
          searchParams.get('placeholder') !== null
            ? 'image-blur'
            : 'image-optimize',
        pluginData: {
          params: searchParams,
        },
      };
    });

    build.onLoad({ filter: /.*/, namespace: 'image-blur' }, async args => {
      const { params } = args.pluginData;
      const filePath = params.get('path');
      const time = Date.now();

      // TODO change width and height to be based on image metadata
      const height = 60;
      const width = 80;

      const buffer = await sharp(filePath)
        .resize(width, height)
        .jpeg({ quality: 25 })
        .blur()
        .toBuffer();

      console.log(
        `PLACEHOLDER ${path.parse(filePath).name} in ${Date.now() - time}ms`
      );

      return {
        contents: buffer.toString('base64'),
        loader: 'text',
      };
    });

    build.onLoad({ filter: /.*/, namespace: 'image-optimize' }, async args => {
      const { params } = args.pluginData;
      const filePath = params.get('path');
      const time = Date.now();

      // TODO change width and height to be based on image metadata
      const height = 1440;
      const width = 1920;

      const buffer = await sharp(filePath)
        .resize(width, height)
        .webp({ quality: 70 })
        .toBuffer();

      console.log(
        `OPTIMIZED ${path.parse(filePath).name} in ${Date.now() - time}ms`
      );

      return {
        contents: buffer,
        loader: 'file',
      };
    });

    build.onLoad({ filter: /.*/, namespace: 'image' }, async args => {
      const rootImage = `optimize:${args.path.replace(
        /\.(jpg|jpeg|png)$/,
        '.webp'
      )}?path=${encodeURIComponent(args.path)}`;

      return {
        contents: `
        import image from "${rootImage}";
        import placeholder from "${rootImage}&placeholder";

        export default {
          src: image,
          placeholder
        }
        `.trim(),
        loader: 'js',
        resolveDir: '/',
      };
    });
  },
};

module.exports = plugin;
