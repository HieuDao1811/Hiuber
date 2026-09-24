import { CursorPage } from "../interface/index.js";

export const toCursorPage = <Item extends { id: string }>(
  items: Item[],
  limit: number,
): CursorPage<Item> => {
  const hasNextPage = items.length > limit;
  const visibleItems = hasNextPage ? items.slice(0, limit) : items;

  return {
    items: visibleItems,
    nextCursor: hasNextPage
      ? (visibleItems[visibleItems.length - 1]?.id ?? null)
      : null,
  };
};
