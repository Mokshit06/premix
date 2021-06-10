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
        // .filter(i => i.kind === 'import-statement')
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

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// export function getStylesheetMap(metafile: Metafile) {
//   const { inputs } = metafile;
//   const files = [];

//   Object.keys(inputs).forEach(file => {
//     const fileUrl = new URL(`https://example.com/${file}`);
//     const isCss = /\.css$/.test(fileUrl.pathname);
//     const isUrlLoaded = /^\/url-file:(.*)\.css$/.test(fileUrl.pathname);

//     if (!isCss || isUrlLoaded) return;

//     files.push(file);
//   });

//   return Object.fromEntries(
//     files
//       .map(i => {
//         const inputs = getInputs(metafile, i);
//         return inputs;
//       })
//       .map(input => {
//         const [js, css] = input;
//         const filesImported = getFilesImported(metafile, js);

//         if (filesImported.length === 0) {
//           filesImported.push(js);
//         }

//         return [css, filesImported];
//       })
//   );
// }

// Old map
// {
//   'styles/style.css': [
//     'pages/index.js',
//     'pages/about.js'
//   ],
// };

// New map
// {
//   'pages/index.js': 'pages/index.css',
//   'pages/about.js': 'pages/about.css'
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
        const arr = input.split('.');
        return [
          input,
          Object.keys(metafile.outputs).find(x => {
            return new RegExp(
              String.raw`${escapeRegExp(arr[1])}.(.*).css`
            ).test(x);
          }),
        ];
      })
  );
}

export function getPageChunk(metafile: Metafile, file: string) {
  const { outputs } = metafile;

  for (const [name, data] of Object.entries(outputs)) {
    if (data.entryPoint === file) {
      return name;
    }
  }
}
