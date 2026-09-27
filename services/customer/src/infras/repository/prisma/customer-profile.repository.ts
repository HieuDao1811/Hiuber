import type { PrismaClient } from "../../../generated/prisma/client.js";
import type {
  CreateCustomerProfileData,
  ICustomerProfileRepository,
  UpdateCustomerProfileData,
} from "../../../interface/repository/customer-profile.repository.js";

const isUniqueConstraintError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === "P2002";

export class PrismaCustomerProfileRepository
  implements ICustomerProfileRepository
{
  constructor(private readonly database: PrismaClient) {}

  findByUserId(userId: string) {
    return this.database.customerProfile.findUnique({ where: { userId } });
  }

  async create(data: CreateCustomerProfileData) {
    try {
      return await this.database.customerProfile.create({ data });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return null;
      }
      throw error;
    }
  }

  async updateByUserId(userId: string, data: UpdateCustomerProfileData) {
    const result = await this.database.customerProfile.updateMany({
      where: { userId },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.database.customerProfile.findUnique({ where: { userId } });
  }
}
