import { CreateCommand, IAuthCommandHandler, IAuthRepository,  } from "../interface/index.js";
import { ErrEmailAlreadyExists, ErrInvalidRegisterData } from "../model/errors.js";
import { CreateUserSchema } from "../model/user.dto.js";
import { User } from "../model/user.js";
import bcrypt from "bcrypt";
import { v7 } from 'uuid';

export class RegisterCommandHandler implements IAuthCommandHandler<CreateCommand, User> {
  constructor(private readonly repository: IAuthRepository) {}

  async execute(command: CreateCommand): Promise<User> {
    const { success, data, error } = CreateUserSchema.safeParse(command);
    if (!success) {
      throw ErrInvalidRegisterData;
    }

    const isExist = await this.repository.findByEmail(data.email);
    if (isExist) {
      throw ErrEmailAlreadyExists;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    
    const user: User = {
      id: v7(),
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: data.role,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const newUser = await this.repository.create(user);

    return newUser;
  }
}
