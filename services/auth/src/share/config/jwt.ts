import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { StringValue } from "ms";
import { TokenPayload } from "../../interface/index.js";

export class JwtTokenService {
  constructor(
    private readonly accessSecretKey: string,
    private readonly refreshSecretKey: string,
    private readonly accessExpiresIn: StringValue,
    private readonly refreshExpiresIn: StringValue,
  ) {}

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.accessSecretKey, {
      algorithm: "HS256",
      expiresIn: this.accessExpiresIn,
    });
  }

  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.refreshSecretKey, {
      algorithm: "HS256",
      expiresIn: this.refreshExpiresIn,
      jwtid: randomUUID(),
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.accessSecretKey, {
      algorithms: ["HS256"],
    }) as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.refreshSecretKey, {
      algorithms: ["HS256"],
    }) as TokenPayload;
  }

  getExpiresAt(token: string): Date {
    const decoded = jwt.decode(token);

    if (!decoded || typeof decoded === "string" || typeof decoded.exp !== "number") {
      throw new Error("Token has no expiry");
    }

    return new Date(decoded.exp * 1000);
  }
}

const requiredEnvironmentVariable = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
};

export const jwtProvider = new JwtTokenService(
  requiredEnvironmentVariable("ACCESS_TOKEN_SECRET"),
  requiredEnvironmentVariable("REFRESH_TOKEN_SECRET"),
  requiredEnvironmentVariable("ACCESS_TOKEN_EXPIRES_IN") as StringValue,
  requiredEnvironmentVariable("REFRESH_TOKEN_EXPIRES_IN") as StringValue,
);
