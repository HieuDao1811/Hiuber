import type { CursorPage } from "../../interface/index.js";

export const dataResponse = <Data>(data: Data) => ({ data });

export const cursorPageResponse = <Data>(page: CursorPage<Data>) => ({
  data: page.items,
  pagination: { nextCursor: page.nextCursor },
});

export const errorResponse = (
  code: string,
  message: string,
  details?: unknown,
) => ({
  error: {
    code,
    message,
    ...(details === undefined ? {} : { details }),
  },
});
