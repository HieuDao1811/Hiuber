import jwt from "jsonwebtoken";
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
      expiresIn: this.accessExpiresIn,
    });
  }

  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.refreshSecretKey, {
      expiresIn: this.refreshExpiresIn,
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.accessSecretKey) as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.refreshSecretKey) as TokenPayload;
  }

  getExpiresAt(token: string): Date {
    const decoded = jwt.decode(token);

    if (!decoded || typeof decoded === "string" || typeof decoded.exp !== "number") {
      throw new Error("Token has no expiry");
    }

    return new Date(decoded.exp * 1000);
  }
}

export const jwtProvider = new JwtTokenService(
  process.env.ACCESS_TOKEN_SECRET!,
  process.env.REFRESH_TOKEN_SECRET!,
  process.env.ACCESS_TOKEN_EXPIRES_IN as StringValue,
  process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue,
);