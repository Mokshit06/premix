export default function uniqueLinks<
  TArr extends Array<{
    href: string;
    rel: string;
  }>
>(arr: TArr) {
  const uniqueItems = [] as TArr;

  for (let i = 0; i < arr.length; i++) {
    const arrItem = arr[i];
    if (uniqueItems.findIndex(x => x.href === arrItem.href) === -1) {
      uniqueItems.push(arrItem);
    }
  }

  return uniqueItems;
}
