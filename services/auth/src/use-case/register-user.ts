import { Role, Status } from "../config/enum.js";
import { IUserCommandHandler, RegisterUserCommand } from "../interface/i-command.js";
import { IUserRepository } from "../interface/i-repository.js";
import { RegisterUserDTOSchema } from "../model/dto.js";
import { ErrInvalidRegisterUserData, ErrUserAlreadyExists } from "../model/error.js";
import { v7 } from "uuid";
import bcrypt from "bcrypt";

export class RegisterUserCmdHandler implements IUserCommandHandler<RegisterUserCommand, string> {
  constructor(private readonly repository: IUserRepository) {}

  async execute(cmd: RegisterUserCommand): Promise<string> {
    const { success, data, error } = RegisterUserDTOSchema.safeParse(cmd.cmd);

    if (!success) {
      throw ErrInvalidRegisterUserData;
    }

    const { name, email, password, image } = data;

    const existedUser = await this.repository.findByCond({ email });
    if (existedUser) {
      throw ErrUserAlreadyExists;
    }

    const newId = v7();

    const hashPassword = bcrypt.hashSync(password, 10);
    const user = {
      id: newId,
      name,
      email,
      password: hashPassword,
      image,
      status: Status.ACTIVE,
      role: Role.CUSTOMER
    }

    await this.repository.insert(user);

    return newId;
  }
}