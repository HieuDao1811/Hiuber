import {
  CreateCommand,
  IAuthCommandHandler,
  IAuthRepository,
} from "../interface/index.js";
import {
  ErrEmailAlreadyExists,
  ErrInvalidRegisterData,
} from "../model/errors.js";
import { CreateUserSchema } from "../model/user.dto.js";
import { PublicUser, toPublicUser } from "../model/user.js";
import bcrypt from "bcrypt";
import { Role, UserStatus } from "../share/enums/index.js";

export class RegisterCommandHandler
  implements IAuthCommandHandler<CreateCommand, PublicUser>
{
  constructor(private readonly repository: IAuthRepository) {}

  async execute(command: CreateCommand): Promise<PublicUser> {
    const { success, data } = CreateUserSchema.safeParse(command.command);
    if (!success) {
      throw ErrInvalidRegisterData;
    }

    const isExist = await this.repository.findByEmail(data.email);
    if (isExist) {
      throw ErrEmailAlreadyExists;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    
    const newUser = await this.repository.create({
      email: data.email,
      passwordHash,
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    });

    return toPublicUser(newUser);
  }
}
