export async function fetchRouteData(url: string) {
  const res = await fetch(`/_premix/data${url === '/' ? '/index' : url}.json`);
  const data = await res.json();

  return data;
}
