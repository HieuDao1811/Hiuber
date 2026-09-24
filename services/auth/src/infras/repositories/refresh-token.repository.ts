import { IRefreshTokenRepository } from "../../interface/index.js";
import { RefreshToken } from "../../model/refresh-token.js";
import { prisma } from "../databases/prisma.js";

export class RefreshTokenRepository implements IRefreshTokenRepository {
  async create(token: RefreshToken): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data: token });
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({ where: { token } });
  }

  async revoke(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
