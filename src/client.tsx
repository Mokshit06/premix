export function useFetchRouteData() {
  return async (url: string) => {
    const res = await fetch(`/_premix/data?href=${url}`);
    const data = await res.json();

    return data;
  };
}
