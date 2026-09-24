// src/usecase/refresh-token.ts
import { v7 } from "uuid";
import {
  IAuthCommandHandler,
  IAuthRepository,
  IRefreshTokenRepository,
  RefreshTokenCommand,
  TokenPair,
} from "../interface/index.js";
import { RefreshTokenSchema } from "../model/user.dto.js";
import { jwtProvider } from "../share/config/jwt.js";
import {
  ErrInvalidRefreshToken,
  ErrUserDeleted,
} from "../model/errors.js";
import { UserStatus } from "../share/enums/index.js";

export class RefreshTokenCommandHandler implements IAuthCommandHandler<
  RefreshTokenCommand,
  TokenPair
> {
  constructor(
    private readonly userRepository: IAuthRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<TokenPair> {
    const { refreshToken } = RefreshTokenSchema.parse(command.command);

    let payload;
    try {
      payload = jwtProvider.verifyRefreshToken(refreshToken);
    } catch {
      throw ErrInvalidRefreshToken;
    }

    const savedToken =
      await this.refreshTokenRepository.findByToken(refreshToken);

    if (!savedToken || savedToken.expiresAt <= new Date()) {
      if (savedToken) {
        await this.refreshTokenRepository.revoke(refreshToken);
      }
      throw ErrInvalidRefreshToken;
    }

    const user = await this.userRepository.findById(payload.sub);
    if (
      !user ||
      user.status === UserStatus.DELETED
    ) {
      await this.refreshTokenRepository.revoke(refreshToken);
      throw ErrUserDeleted;
    }

    // Token rotation: token cũ chỉ dùng được một lần.
    await this.refreshTokenRepository.revoke(refreshToken);

    const newPayload = { sub: user.id, role: user.role };
    const accessToken = jwtProvider.generateAccessToken(newPayload);
    const newRefreshToken = jwtProvider.generateRefreshToken(newPayload);

    await this.refreshTokenRepository.create({
      id: v7(),
      userId: user.id,
      token: newRefreshToken,
      expiresAt: jwtProvider.getExpiresAt(newRefreshToken),
      createdAt: new Date(),
    });

    return { accessToken, refreshToken: newRefreshToken };
  }
}
