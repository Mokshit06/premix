export default function exec(
  path: string,
  result: {
    keys: Array<string>;
    pattern: RegExp;
  }
) {
  let i = 0;
  const out = {};
  const matches = result.pattern.exec(path);
  while (i < result.keys.length) {
    out[result.keys[i]] = matches[++i] || null;
  }

  return out;
}
