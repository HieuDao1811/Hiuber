import type { NextFunction, Request, Response } from "express";
import { RequesterSchema, UserRole } from "../interface/requester.js";
import { Errors } from "../shared/app-error.js";

export const authorizeCustomer = (
  _request: Request,
  response: Response,
  next: NextFunction,
) => {
  const requester = RequesterSchema.parse(response.locals.requester);

  if (requester.role !== UserRole.CUSTOMER) {
    throw Errors.insufficientRole();
  }

  next();
};
