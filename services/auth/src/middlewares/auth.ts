import { Request, Response, NextFunction, Handler } from "express";
import { ITokenIntrospect, Requester } from "../interface/i-repository.js";

export function authMiddleware(introspector: ITokenIntrospect): Handler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      console.log(token);
      if (!token) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { payload, error, isOk } = await introspector.introspect(token);
      if (!isOk) {
        res.status(401).json({ error: error?.message || "Unauthorized" });
        return;
      }

      const requester = payload as Requester;
      res.locals.requester = requester;

      next();
    } catch (error) {
      res.status(401).json({ error: (error as Error).message });
    }
  }
}