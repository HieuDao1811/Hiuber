import type { Response } from "express";

export const sendData = <T>(response: Response, data: T, statusCode = 200) =>
  response.status(statusCode).json({ data });

export const sendError = (
  response: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
) =>
  response.status(statusCode).json({
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  });
