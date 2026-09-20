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
  ErrUserInactivatedOrDeleted,
} from "../model/errors.js";
import { Status } from "../share/enums/index.js";

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

    if (user.status === Status.DELETED || user.status === Status.INACTIVED) {
      throw ErrUserInactivatedOrDeleted;
    }

    const payload = { sub: user.id, role: user.role };
    const accessToken = jwtProvider.generateAccessToken(payload);
    const refreshToken = jwtProvider.generateRefreshToken(payload);

    await this.refreshTokenRepository.create({
      id: v7(),
      userId: user.id,
      token: refreshToken,
      expiresAt: jwtProvider.getExpiresAt(refreshToken),
    });

    return { accessToken, refreshToken };
  }
}
