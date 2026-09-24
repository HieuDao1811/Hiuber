import { NextFunction, Request, Response } from "express";
import { jwtProvider } from "../share/config/jwt.js";
import { TokenPayloadSchema } from "../model/user.dto.js";
import { Role } from "../share/enums/index.js";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const [scheme, token] = req.headers.authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    const payload = TokenPayloadSchema.parse(
      jwtProvider.verifyAccessToken(token),
    );

    res.locals.requester = payload;

    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
}

export const authorize =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const requester = res.locals.requester;
    if (!requester) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    if (!roles.includes(requester.role)) {
      res.status(403).json({
        message: "Forbidden",
      });
      return;
    }

    next();
  };
