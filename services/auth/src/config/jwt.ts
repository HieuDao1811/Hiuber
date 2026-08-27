import { StringValue } from "ms";
import { TokenPayload } from "./enum.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

class JwtTokenService {
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
}

export const jwtProvider = new JwtTokenService(process.env.JWT_SECRET_KEY || "hieudao1811", "7d");