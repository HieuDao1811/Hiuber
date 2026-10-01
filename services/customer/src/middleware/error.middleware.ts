import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/app-error.js";
import { errorResponse } from "../shared/http-response.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    res
      .status(400)
      .json(errorResponse("VALIDATION_ERROR", "Invalid input", error.flatten()));
    return;
  }

  if (
    error instanceof SyntaxError &&
    typeof error === "object" &&
    "status" in error &&
    error.status === 400
  ) {
    res
      .status(400)
      .json(errorResponse("INVALID_JSON", "Request body contains invalid JSON"));
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json(errorResponse(error.code, error.message));
    return;
  }

  console.error(error);
  res
    .status(500)
    .json(errorResponse("INTERNAL_SERVER_ERROR", "Internal Server Error"));
};
