import { Request, Response } from "express";
import { VerifyAccessTokenQueryHandler } from "../../usecase/verify-access-token.js";

export class InternalAuthHttpService {
  constructor(
    private readonly verifyAccessTokenQuery: VerifyAccessTokenQueryHandler,
  ) {}

  async verifyAccessToken(req: Request, res: Response) {
    const payload = await this.verifyAccessTokenQuery.query(req.body);
    return res.status(200).json(payload);
  }
}
