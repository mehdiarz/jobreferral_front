export async function getAllPages<T>(
  fetchPage: (params: {
    skipCount: number;
    maxResultCount: number;
  }) => Promise<{
    items: T[];
    totalCount: number;
  }>,
): Promise<T[]> {
  const pageSize = 1000;
  let skipCount = 0;
  let totalCount = Number.MAX_SAFE_INTEGER;
  const allItems: T[] = [];

  while (allItems.length < totalCount) {
    const result = await fetchPage({
      skipCount,
      maxResultCount: pageSize,
    });

    const items = result.items ?? [];

    if (!items.length) {
      break;
    }

    allItems.push(...items);

    totalCount = result.totalCount || allItems.length;
    skipCount += items.length;

    if (items.length < pageSize) {
      break;
    }
  }

  return allItems;
}
