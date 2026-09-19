import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import {
  ErrEmailAlreadyExists,
  ErrInvalidEmailOrPassword,
  ErrInvalidRegisterData,
  ErrUserInactivatedOrDeleted,
  ErrUserNotFound,
} from "../model/errors.js";

const domainErrorStatuses = new Map<Error, number>([
  [ErrInvalidRegisterData, 400],
  [ErrInvalidEmailOrPassword, 401],
  [ErrUserInactivatedOrDeleted, 403],
  [ErrUserNotFound, 404],
  [ErrEmailAlreadyExists, 409],
]);

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Invalid input",
      error: err.flatten(),
    });
  }

  if (err instanceof Error) {
    const status = domainErrorStatuses.get(err);
    if (status) {
      return res.status(status).json({
        message: err.message,
      });
    }
  }

  return res.status(500).json({
    message: "Internal server error",
  });
}
