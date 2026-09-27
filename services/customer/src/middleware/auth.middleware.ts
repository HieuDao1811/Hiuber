import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { IAuthService } from "../interface/auth-service.js";
import { ForbiddenError, UnauthenticatedError } from "../model/errors.js";
import { RequesterSchema, UserRole } from "../model/requester.js";

export const authenticate = (authService: IAuthService): RequestHandler =>
  async (request: Request, response: Response, next: NextFunction) => {
    const authorization = request.header("authorization");
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);

    if (!match?.[1]) {
      next(new UnauthenticatedError());
      return;
    }

    try {
      response.locals.requester = await authService.verifyAccessToken(match[1]);
      next();
    } catch (error) {
      next(error);
    }
  };

export const authorizeCustomer: RequestHandler = (
  _request,
  response,
  next,
) => {
  const requester = RequesterSchema.safeParse(response.locals.requester);

  if (!requester.success) {
    next(new UnauthenticatedError());
    return;
  }

  if (requester.data.role !== UserRole.CUSTOMER) {
    next(new ForbiddenError());
    return;
  }

  next();
};
