import type { PrismaClient } from "../../../generated/prisma/client.js";
import type {
  CreateCustomerAddressData,
  ICustomerAddressRepository,
  UpdateCustomerAddressData,
} from "../../../interface/repository/customer-address.repository.js";

export class PrismaCustomerAddressRepository
  implements ICustomerAddressRepository
{
  constructor(private readonly database: PrismaClient) {}

  findManyByCustomerId(customerId: string) {
    return this.database.customerAddress.findMany({
      where: { customerId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  create(data: CreateCustomerAddressData) {
    return this.database.customerAddress.create({ data });
  }

  updateOwned(
    addressId: string,
    customerId: string,
    data: UpdateCustomerAddressData,
  ) {
    return this.database.$transaction(async (transaction) => {
      const result = await transaction.customerAddress.updateMany({
        where: { id: addressId, customerId },
        data,
      });

      if (result.count === 0) {
        return null;
      }

      return transaction.customerAddress.findFirst({
        where: { id: addressId, customerId },
      });
    });
  }

  async deleteOwned(addressId: string, customerId: string) {
    const result = await this.database.customerAddress.deleteMany({
      where: { id: addressId, customerId },
    });

    return result.count > 0;
  }

  setDefault(addressId: string, customerId: string) {
    return this.database.$transaction(async (transaction) => {
      await transaction.$queryRaw`
        SELECT "id"
        FROM "customer_profiles"
        WHERE "id" = ${customerId}::uuid
        FOR UPDATE
      `;

      const ownedAddress = await transaction.customerAddress.findFirst({
        where: { id: addressId, customerId },
      });

      if (!ownedAddress) {
        return null;
      }

      await transaction.customerAddress.updateMany({
        where: { customerId, isDefault: true },
        data: { isDefault: false },
      });

      const result = await transaction.customerAddress.updateMany({
        where: { id: addressId, customerId },
        data: { isDefault: true },
      });

      if (result.count === 0) {
        return null;
      }

      return transaction.customerAddress.findFirst({
        where: { id: addressId, customerId },
      });
    });
  }
}
