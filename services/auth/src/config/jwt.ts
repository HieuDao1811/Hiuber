import { StringValue } from "ms";
import { TokenPayload } from "./enum.js";
import { ITokenIntrospect, TokenIntrospectResult } from "../interface/i-repository.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

class JwtTokenService implements ITokenIntrospect {
  private readonly secretKey: string;
  private readonly expiresIn: StringValue;

  constructor(secretKey: string, expiresIn: StringValue) {
    this.secretKey = secretKey;
    this.expiresIn = expiresIn;
  }

  async generateToken(payload: TokenPayload) {
    return jwt.sign(payload, this.secretKey, { expiresIn: this.expiresIn });
  }

  async verifyToken(token: string) {
    const decoded = jwt.verify(token, this.secretKey) as TokenPayload;
    return decoded;
  }

  async introspect(token: string): Promise<TokenIntrospectResult> {
    try {
      return {
        payload: await this.verifyToken(token),
        isOk: true
      };
    } catch (error) {
      return {
        payload: null,
        error: error as Error,
        isOk: false
      };
    }
  }
}

export const jwtProvider = new JwtTokenService(process.env.JWT_SECRET_KEY || "hieudao1811", "7d");