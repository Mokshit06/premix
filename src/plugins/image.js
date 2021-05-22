const chalk = require('chalk');

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

      const { searchParams } = new URL(`https://example.com/${args.path}`);

      return {
        path: filePath,
        namespace: 'image',
        pluginData: {
          params: searchParams,
        },
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

      const transformer = sharp(filePath)
        .normalise()
        .modulate({
          saturation: 1.2,
          brightness: 1,
        })
        .removeAlpha()
        .resize(30, 30, { fit: 'inside' });

      const {
        data,
        info: { format },
      } = await transformer.toBuffer({ resolveWithObject: true });

      const base64 = `data:image/${format};base64,${data.toString('base64')}`;

      console.log(
        chalk.blue`{bold Placeholder}: ${
          path.parse(filePath).base
        } in {underline ${Date.now() - time}ms}`
      );

      return {
        contents: base64,
        loader: 'text',
      };
    });

    build.onLoad({ filter: /.*/, namespace: 'image-optimize' }, async args => {
      const { params } = args.pluginData;
      const width = parseNumber(params.get('width'));
      const filePath = params.get('path');

      const time = Date.now();

      const transformer = sharp(filePath).rotate();

      const { width: metaWidth } = await transformer.metadata();

      if (metaWidth && width && metaWidth > width) {
        transformer.resize(width);
      }

      const buffer = await transformer.toBuffer();

      console.log(
        chalk.cyan`{bold Image}: ${path.parse(filePath).base} in {underline ${
          Date.now() - time
        }ms}`
      );

      return {
        contents: buffer,
        loader: 'file',
      };
    });

    build.onLoad({ filter: /.*/, namespace: 'image' }, async args => {
      const { params } = args.pluginData;
      const pathname = new URL(`https://example.com${args.path}`).pathname;
      const height = params.get('height');
      const width = params.get('width');
      const rootImage = `optimize:${pathname.replace(
        /\.(jpg|jpeg|png)$/,
        '.webp'
      )}?path=${encodeURIComponent(pathname)}&height=${height}&width=${width}`;
      const shouldGeneratePlaceholder = params.get('placeholder') !== null;

      const transformer = sharp(pathname);
      const {
        width: metaWidth,
        height: metaHeight,
      } = await transformer.metadata();
      const aspectRatio = metaWidth / metaHeight;
      const numberWidth = parseNumber(width);

      return {
        contents: `
        import image from "${rootImage}";
        ${
          shouldGeneratePlaceholder
            ? `import placeholder from "${rootImage}&placeholder";`
            : ''
        }

        export default function Image({ className }) {
          return (
            <img
              height={${numberWidth ? numberWidth / aspectRatio : metaHeight}}
              width={${numberWidth ? numberWidth : metaWidth}}
              src={image}
              loading="lazy"
              style={${
                shouldGeneratePlaceholder
                  ? `{
                backgroundImage: \`url('\${placeholder}')\`,
                backgroundSize: 'cover',
              }`
                  : 'null'
              }}
              className={className}
            />
          )
        }
        `.trim(),
        loader: 'jsx',
        resolveDir: '/',
      };
    });
  },
};

module.exports = plugin;

function parseNumber(number) {
  const int = parseInt(number, 10);
  if (isNaN(int)) {
    return 0;
  }

  return int;
}
