import { NextFunction, Request, RequestHandler, Response } from "express";
import { IAuthService } from "../interface/index.js";
import {
  InsufficientRoleError,
  UnauthenticatedError,
} from "../model/errors.js";
import { RequesterSchema } from "../model/requester.js";
import { UserRole } from "../share/enums/index.js";

export const authenticate = (authService: IAuthService): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    const [scheme, accessToken] = req.headers.authorization?.split(" ") ?? [];

    if (scheme?.toLowerCase() !== "bearer" || !accessToken) {
      next(new UnauthenticatedError());
      return;
    }

    try {
      res.locals.requester = await authService.verifyAccessToken(accessToken);
      next();
    } catch (error) {
      next(error);
    }
  };

export const authorize = (...roles: UserRole[]): RequestHandler =>
  (_req: Request, res: Response, next: NextFunction) => {
    const requester = RequesterSchema.safeParse(res.locals.requester);

    if (!requester.success) {
      next(new UnauthenticatedError());
      return;
    }

    if (!roles.includes(requester.data.role)) {
      next(new InsufficientRoleError());
      return;
    }

    next();
  };
