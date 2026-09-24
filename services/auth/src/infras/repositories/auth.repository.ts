import { IAuthRepository } from "../../interface/index.js";
import type { User as PrismaUser } from "../../generated/prisma/client.js";
import { User } from "../../model/user.js";
import { Role, UserStatus } from "../../share/enums/index.js";
import { prisma } from "../databases/prisma.js";

const toDomainUser = (user: PrismaUser): User => ({
  ...user,
  role: Role[user.role],
  status: UserStatus[user.status],
});

export class AuthRepository implements IAuthRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });

    return user ? toDomainUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });

    return user ? toDomainUser(user) : null;
  }

  async create(data: User): Promise<User> {
    const user = await prisma.user.create({ data });

    return toDomainUser(user);
  }
}
