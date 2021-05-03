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
            i.path.replace(/^public/, ''),
            ...getScripts(metafile, i.path),
          ];
        })
    ),
  ];
}

export function getMetaFile(): Metafile {
  const file = fs.readFileSync('build/meta.json', 'utf8');
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

export function getStylesheetMap(metafile: Metafile) {
  const { inputs } = metafile;
  const files = [];

  Object.keys(inputs).forEach(file => {
    const fileUrl = new URL(`https://example.com/${file}`);
    const isCss = /\.css$/.test(fileUrl.pathname);
    const isUrlLoaded = /^\/url-file:(.*)\.css$/.test(fileUrl.pathname);

    if (!isCss || isUrlLoaded) return;

    files.push(file);
  });

  return files
    .map(i => {
      const inputs = getInputs(metafile, i);
      return inputs;
    })
    .reduce((acc, cur) => {
      const [js, css] = cur;
      const filesImported = getFilesImported(metafile, js);

      if (filesImported.length === 0) {
        filesImported.push(js);
      }

      return {
        ...acc,
        [css]: filesImported,
      };
    }, {} as Record<string, string[]>);
}

export function getPageChunk(metafile: Metafile, file: string) {
  const { outputs } = metafile;

  for (const [name, data] of Object.entries(outputs)) {
    if (data.entryPoint === file) {
      return name;
    }
  }
}
