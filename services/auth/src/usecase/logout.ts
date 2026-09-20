// src/usecase/logout.ts
import {
  IAuthCommandHandler,
  IRefreshTokenRepository,
  LogoutCommand,
} from "../interface/index.js";
import { RefreshTokenSchema } from "../model/user.dto.js";

export class LogoutCommandHandler
  implements IAuthCommandHandler<LogoutCommand, void>
{
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const { refreshToken } = RefreshTokenSchema.parse(command.command);

    // Không cần verify JWT: token bị hết hạn vẫn phải được xoá khỏi DB.
    await this.refreshTokenRepository.revoke(refreshToken);
  }
}