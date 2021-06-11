import { Metafile } from 'esbuild';
import fs from 'fs';

export function getScripts(metafile: Metafile, file: string) {
  const { imports } = metafile.outputs[file];

  return [
    ...new Set(
      imports
        .filter(i => i.kind === 'import-statement')
        .flatMap(i => {
          return [
            i.path.replace(/^\.premix\/public/, ''),
            ...getScripts(metafile, i.path),
          ];
        })
    ),
  ];
}

export function getRootScript(metafile: Metafile) {
  const { outputs } = metafile;

  for (const [name, data] of Object.entries(outputs)) {
    if (data.entryPoint === 'app/entry-client.tsx') {
      return name;
    }
  }
}

export function getMetaFile(): Metafile {
  const file = fs.readFileSync('.premix/build/meta.json', 'utf8');
  if (!file) {
    throw new Error('`build/meta.json` not found. Run `yarn build`');
  }

  return JSON.parse(file);
}

function getFilesImported(metafile: Metafile, file: string) {
  const { outputs } = metafile;
  const imports: string[] = [];

  Object.entries(outputs).forEach(([name, data]) => {
    if (
      data.imports
        .filter(i => i.kind === 'import-statement')
        .some(i => i.path === file)
    ) {
      imports.push(name);
    }
  });

  return imports;
}

function getInputs(metafile: Metafile, file: string) {
  const { outputs } = metafile;
  const inputs: string[] = [];

  Object.entries(outputs).forEach(([name, data]) => {
    const inputKeys = Object.keys(data.inputs);

    if (inputKeys.includes(file)) {
      inputs.push(name);
    }
  });

  return inputs;
}

// Old map
// {
//   'styles/style.[hash].css': [
//     'pages/index.[hash].js',
//     'pages/about.[hash].js'
//   ],
// };

// New map
// {
//   'pages/index.[hash].js': 'styles/style.[hash].css',
//   'pages/about.[hash].js': 'styles/about.[hash].css'
// }

export function getStylesheetMap(metafile: Metafile) {
  const { inputs } = metafile;
  const files = [];

  Object.keys(inputs).forEach(file => {
    const fileUrl = new URL(`https://example.com/${file}`);
    const isPage = /app\/pages\/(.*)\.([tj]sx?)$/.test(fileUrl.pathname);

    if (!isPage) return;

    files.push(file);
  });

  return Object.fromEntries(
    files
      .map(file => {
        return getInputs(metafile, file);
      })
      .map(([input]) => {
        const [, name] = input.split('.');

        return [
          input,
          Object.keys(metafile.outputs).find(x => {
            // CSS chunk name should match JS chunk
            // JS -> $post.[hash].js
            // CSS -> $post.[hash].css
            return new RegExp(String.raw`${escapeRegExp(name)}.(.*).css`).test(
              x
            );
          }),
        ];
      })
  );
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getPageChunk(metafile: Metafile, file: string) {
  const { outputs } = metafile;

  for (const [name, data] of Object.entries(outputs)) {
    if (data.entryPoint === file) {
      return name;
    }
  }
}
