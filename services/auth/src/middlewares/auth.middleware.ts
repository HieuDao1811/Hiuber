import { NextFunction, Request, Response } from "express";
import { jwtProvider } from "../share/config/jwt.js";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    const payload = jwtProvider.verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({
        message: "Invalid or expired token",
      });
      return;
    }

    res.locals.requester = payload;

    next();
  } catch (error) {
    res.status(401).json({ error: (error as Error).message })
  }
}

export const authorize = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
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
}
