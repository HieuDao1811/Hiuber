import jwt from "jsonwebtoken";
import { StringValue } from "ms";
import { TokenPayload } from "../../interface/index.js";
import dotenv from "dotenv";

dotenv.config();

export class JwtTokenService {
  private readonly secretKey: string;
  private readonly expiresIn: StringValue;

  constructor(secretKey: string, expiresIn: StringValue) {
    this.secretKey = secretKey;
    this.expiresIn = expiresIn;
  }

  async generateToken(payload: TokenPayload): Promise<string> {
    return jwt.sign(payload, this.secretKey, { expiresIn: this.expiresIn });
  }

  async verifyToken(token: string): Promise<TokenPayload | null> {
    const decoded = jwt.verify(token, this.secretKey) as TokenPayload;
    return decoded;
  }
}

export const jwtProvide = new JwtTokenService(process.env.SECRET_KEY!, process.env.EXPIRES_IN as StringValue);