import type { NextFunction, Request, Response } from "express";
import type { IAuthRpc } from "../interface/rpc/auth-rpc.js";
import { Errors } from "../shared/app-error.js";

export const authenticate = (authRpc: IAuthRpc) =>
  async (_request: Request, response: Response, next: NextFunction) => {
    const authorization = _request.header("authorization");
    const [scheme, token] = authorization?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token) {
      throw Errors.unauthenticated();
    }

    response.locals.requester = await authRpc.verify(token);
    next();
  };
