import { IAuthCommandHandler, IAuthRepository, LoginCommand } from "../interface/index.js";
import { LoginSchema } from "../model/user.dto.js";
import bcrypt from "bcrypt";
import { jwtProvider } from "../share/config/jwt.js";
import { ErrInvalidEmailOrPassword, ErrUserInactivatedOrDeleted } from "../model/errors.js";
import { Status } from "../share/enums/index.js";

export class LoginCommandHandler implements IAuthCommandHandler<LoginCommand, string> {
  constructor(private readonly repository: IAuthRepository) {}

  async execute(command: LoginCommand): Promise<string> {
    const { email, password } = LoginSchema.parse(command.command);

    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw ErrInvalidEmailOrPassword;
    }

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      throw ErrInvalidEmailOrPassword;
    }

    if (user.status === Status.DELETED || user.status === Status.INACTIVED) {
      throw ErrUserInactivatedOrDeleted;
    }

    // Generate token
    const sub = user.id;
    const role = user.role;

    const accessToken = jwtProvider.generateToken({ sub, role });
    return accessToken;
  }
}