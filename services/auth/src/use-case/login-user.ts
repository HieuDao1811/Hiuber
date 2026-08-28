import { Status } from "../config/enum.js";
import { jwtProvider } from "../config/jwt.js";
import { IUserCommandHandler, LoginUserCommand } from "../interface/i-command.js";
import { IUserRepository } from "../interface/i-repository.js";
import { LoginUserDTOSchema } from "../model/dto.js";
import { ErrInvalidEmailOrPassword, ErrInvalidLoginData, ErrUserNotFound } from "../model/error.js";
import bcrypt from "bcrypt";

export class LoginUserCmdHandler implements IUserCommandHandler<LoginUserCommand, string> {
  constructor(private readonly repository: IUserRepository) {}

  async execute(cmd: LoginUserCommand): Promise<string> {
    const { success, data, error } = LoginUserDTOSchema.safeParse(cmd.cmd);
    if (!success) {
      throw ErrInvalidLoginData;
    }

    const { email, password } = data;

    const user = await this.repository.findByCond({ email });
    if (!user) {
      throw ErrInvalidEmailOrPassword;
    }

    // Check password
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      throw ErrInvalidEmailOrPassword;
    }

    if (user.status === Status.DELETED) {
      throw ErrUserNotFound;
    }

    const role = user.role;

    const token = await jwtProvider.generateToken({ sub: user.id, role });
    return token;
  }
}