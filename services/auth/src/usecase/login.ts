// src/usecase/login.ts
import bcrypt from "bcrypt";
import {
  IAuthCommandHandler,
  IAuthRepository,
  IRefreshTokenRepository,
  ITokenService,
  LoginCommand,
  TokenPair,
} from "../interface/index.js";
import { LoginSchema } from "../model/user.dto.js";
import {
  ErrInvalidEmailOrPassword,
  ErrUserDeleted,
} from "../model/errors.js";
import { UserStatus } from "../share/enums/index.js";

export class LoginCommandHandler implements IAuthCommandHandler<
  LoginCommand,
  TokenPair
> {
  constructor(
    private readonly userRepository: IAuthRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(command: LoginCommand): Promise<TokenPair> {
    const { email, password } = LoginSchema.parse(command.command);

    const user = await this.userRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw ErrInvalidEmailOrPassword;
    }

    if (user.status === UserStatus.DELETED) {
      throw ErrUserDeleted;
    }

    const payload = { sub: user.id, role: user.role };
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    await this.refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: this.tokenService.getExpiresAt(refreshToken),
    });

    return { accessToken, refreshToken };
  }
}
