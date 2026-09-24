import { NextFunction, Request, RequestHandler, Response } from "express";
import { IAuthService } from "../interface/index.js";
import {
  UnauthenticatedError,
} from "../model/errors.js";

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
