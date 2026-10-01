import type { RequestHandler } from "express";
import type { IAuthService } from "../interface/auth-service.js";
import { ForbiddenError, UnauthenticatedError } from "../model/errors.js";
import { RequesterSchema } from "../model/requester.js";
import type { UserRole } from "../share/enums/index.js";

export const authenticate = (authService: IAuthService): RequestHandler =>
  async (request, response, next) => {
    const match = request.header("authorization")?.match(/^Bearer\s+(\S+)$/i);
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

export const authorize = (...roles: UserRole[]): RequestHandler =>
  (_request, response, next) => {
    const requester = RequesterSchema.safeParse(response.locals.requester);
    if (!requester.success) {
      next(new UnauthenticatedError());
      return;
    }
    if (!roles.includes(requester.data.role)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
