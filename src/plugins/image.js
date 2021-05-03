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

      const transformer = sharp(filePath)
        .normalise()
        .modulate({
          saturation: 1.2,
          brightness: 1,
        })
        .removeAlpha()
        .resize(10, 10, { fit: 'inside' });

      const {
        data,
        info: { format },
      } = await transformer.toBuffer({ resolveWithObject: true });

      const base64 = `data:image/${format};base64,${data.toString('base64')}`;

      return {
        contents: base64,
        loader: 'text',
      };
    });

    build.onLoad({ filter: /.*/, namespace: 'image-optimize' }, async args => {
      const { params } = args.pluginData;
      const width = parseNumber(params.get('width'));
      const filePath = params.get('path');

      const transformer = sharp(filePath).rotate();

      const { width: metaWidth } = await transformer.metadata();

      if (metaWidth && width && metaWidth > width) {
        transformer.resize(width);
      }

      transformer.webp({ quality: 70 });

      const buffer = await transformer.toBuffer();

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
              style={${
                shouldGeneratePlaceholder
                  ? `{
                backgroundImage: \`url(\${placeholder})\`,
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
