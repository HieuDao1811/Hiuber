import { IRefreshTokenRepository } from "../../interface/index.js";
import {
  CreateRefreshTokenRecord,
  RefreshToken,
} from "../../model/refresh-token.js";
import { prisma } from "../databases/prisma.js";

export class RefreshTokenRepository implements IRefreshTokenRepository {
  async create(token: CreateRefreshTokenRecord): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data: token });
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({ where: { token } });
  }

  async consume(token: string): Promise<boolean> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
    });

    return result.count === 1;
  }

  async revoke(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }
}
