import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../share/components/app-error.js";
import { errorResponse } from "../share/components/http-response.js";

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

  if (error instanceof AppError) {
    res.status(error.status).json(errorResponse(error.code, error.message));
    return;
  }

  res
    .status(500)
    .json(errorResponse("INTERNAL_SERVER_ERROR", "Internal Server Error"));
};
