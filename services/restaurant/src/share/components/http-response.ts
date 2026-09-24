export const dataResponse = <Data>(data: Data) => ({ data });

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
