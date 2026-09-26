import type {
  CreateCustomerProfileData,
  ICustomerProfileRepository,
  UpdateCustomerProfileData,
} from "../../../interface/repository/customer-profile.repository.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";

export class PrismaCustomerProfileRepository
  implements ICustomerProfileRepository
{
  constructor(private readonly database: PrismaClient) {}

  findByUserId(userId: string) {
    return this.database.customerProfile.findUnique({ where: { userId } });
  }

  create(data: CreateCustomerProfileData) {
    return this.database.customerProfile.create({ data });
  }

  updateByUserId(userId: string, data: UpdateCustomerProfileData) {
    return this.database.customerProfile.update({
      where: { userId },
      data,
    });
  }
}
