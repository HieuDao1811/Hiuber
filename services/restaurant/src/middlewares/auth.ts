import { Handler, NextFunction, Request, Response } from "express";

enum Role {
  ADMIN = 'admin',
  CUSTOMER = 'customer'
}

interface TokenPayload {
  sub: string,
  role: Role
}

interface Requester extends TokenPayload {}

type TokenIntrospectResult = {
  payload: TokenPayload | null;
  error?: Error;
  isOk: boolean
}

interface ITokenIntrospect {
  introspect(token: string): Promise<TokenIntrospectResult>
}

export const authMiddleware = (introspector: ITokenIntrospect): Handler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        res.status(401).json({
          message: "Missing access token"
        });
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