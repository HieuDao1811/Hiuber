export const successResponse = <Data>(data: Data, message = "Success") => ({
  data,
  message,
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
