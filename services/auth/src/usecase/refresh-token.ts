import {
  IAuthCommandHandler,
  IAuthRepository,
  IRefreshTokenRepository,
  ITokenService,
  RefreshTokenCommand,
  TokenPair,
} from "../interface/index.js";
import { ErrInvalidRefreshToken, ErrUserDeleted } from "../model/errors.js";
import { RefreshTokenSchema, TokenPayloadSchema } from "../model/user.dto.js";
import { UserStatus } from "../share/enums/index.js";

export class RefreshTokenCommandHandler
  implements IAuthCommandHandler<RefreshTokenCommand, TokenPair>
{
  constructor(
    private readonly userRepository: IAuthRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<TokenPair> {
    const { refreshToken } = RefreshTokenSchema.parse(command.command);

    let payload;
    try {
      payload = TokenPayloadSchema.parse(
        this.tokenService.verifyRefreshToken(refreshToken),
      );
    } catch {
      throw ErrInvalidRefreshToken;
    }

    const savedToken =
      await this.refreshTokenRepository.findByToken(refreshToken);

    if (
      !savedToken ||
      savedToken.userId !== payload.sub ||
      savedToken.expiresAt <= new Date()
    ) {
      if (savedToken) {
        await this.refreshTokenRepository.revoke(refreshToken);
      }
      throw ErrInvalidRefreshToken;
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || user.status === UserStatus.DELETED) {
      await this.refreshTokenRepository.revoke(refreshToken);
      throw ErrUserDeleted;
    }

    // deleteMany makes consuming a refresh token atomic: only one concurrent request wins.
    const consumed = await this.refreshTokenRepository.consume(refreshToken);
    if (!consumed) {
      throw ErrInvalidRefreshToken;
    }

    const newPayload = { sub: user.id, role: user.role };
    const accessToken = this.tokenService.generateAccessToken(newPayload);
    const newRefreshToken = this.tokenService.generateRefreshToken(newPayload);

    await this.refreshTokenRepository.create({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: this.tokenService.getExpiresAt(newRefreshToken),
    });

    return { accessToken, refreshToken: newRefreshToken };
  }
}
