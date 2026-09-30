import type { ICustomerAddressRepository } from "../interface/repository/customer-address.repository.js";
import type { ICustomerProfileRepository } from "../interface/repository/customer-profile.repository.js";
import type { CustomerAddress } from "../model/customer-address.js";
import { CustomerAddressNotFoundError } from "../model/errors.js";
import { getCustomerProfile } from "./customer-access.js";

export class GetAddressQueryHandler {
  constructor(
    private readonly profiles: ICustomerProfileRepository,
    private readonly addresses: ICustomerAddressRepository,
  ) {}

  async query(userId: string, addressId: string): Promise<CustomerAddress> {
    const profile = await getCustomerProfile(this.profiles, userId);
    const address = await this.addresses.findOwned(addressId, profile.id);
    if (!address) {
      throw new CustomerAddressNotFoundError();
    }
    return address;
  }
}
