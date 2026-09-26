import type {
  CreateCustomerAddressData,
  ICustomerAddressRepository,
  UpdateCustomerAddressData,
} from "../../../interface/repository/customer-address.repository.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";

const transactionOptions = { isolationLevel: "Serializable" as const };

export class PrismaCustomerAddressRepository
  implements ICustomerAddressRepository
{
  constructor(private readonly database: PrismaClient) {}

  findManyByCustomerId(customerId: string) {
    return this.database.customerAddress.findMany({
      where: { customerId },
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    });
  }

  create(data: CreateCustomerAddressData) {
    if (!data.isDefault) {
      return this.database.customerAddress.create({ data });
    }

    return this.database.$transaction(async (transaction) => {
      await transaction.customerAddress.updateMany({
        where: { customerId: data.customerId, isDefault: true },
        data: { isDefault: false },
      });

      return transaction.customerAddress.create({ data });
    }, transactionOptions);
  }

  updateOwned(
    addressId: string,
    customerId: string,
    data: UpdateCustomerAddressData,
  ) {
    return this.database.$transaction(async (transaction) => {
      const ownedAddress = await transaction.customerAddress.findFirst({
        where: { id: addressId, customerId },
      });

      if (!ownedAddress) {
        return null;
      }

      if (data.isDefault) {
        await transaction.customerAddress.updateMany({
          where: { customerId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return transaction.customerAddress.update({
        where: { id: addressId },
        data,
      });
    }, transactionOptions);
  }

  async deleteOwned(addressId: string, customerId: string) {
    const result = await this.database.customerAddress.deleteMany({
      where: { id: addressId, customerId },
    });

    return result.count > 0;
  }

  setDefault(addressId: string, customerId: string) {
    return this.database.$transaction(async (transaction) => {
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

      return transaction.customerAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    }, transactionOptions);
  }
}
