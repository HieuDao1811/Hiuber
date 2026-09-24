// src/usecase/login.ts
import bcrypt from "bcrypt";
import { v7 } from "uuid";
import {
  IAuthCommandHandler,
  IAuthRepository,
  IRefreshTokenRepository,
  LoginCommand,
  TokenPair,
} from "../interface/index.js";
import { LoginSchema } from "../model/user.dto.js";
import { jwtProvider } from "../share/config/jwt.js";
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
    const accessToken = jwtProvider.generateAccessToken(payload);
    const refreshToken = jwtProvider.generateRefreshToken(payload);

    await this.refreshTokenRepository.create({
      id: v7(),
      userId: user.id,
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: jwtProvider.getExpiresAt(refreshToken),
    });

    return { accessToken, refreshToken };
  }
}
