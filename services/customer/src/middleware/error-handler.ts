import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/app-error.js";
import { sendError } from "../shared/response.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  next,
) => {
  if (response.headersSent) {
    return next(error);
  }

  if (error instanceof ZodError) {
    return sendError(
      response,
      400,
      "INVALID_INPUT",
      "Request validation failed",
      error.flatten(),
    );
  }

  if (error instanceof AppError) {
    return sendError(
      response,
      error.statusCode,
      error.code,
      error.message,
      error.details,
    );
  }

  console.error(error);
  return sendError(response, 500, "INTERNAL_ERROR", "Internal server error");
};
