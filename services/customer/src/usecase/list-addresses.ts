import type { QueryHandler } from "../interface/query-handler.js";
import type { ICustomerAddressRepository } from "../interface/repository/customer-address.repository.js";
import type { ICustomerProfileRepository } from "../interface/repository/customer-profile.repository.js";
import type { CustomerAddress } from "../model/customer-address.js";
import { getCustomerProfile } from "./customer-access.js";

export class ListAddresses implements QueryHandler<string, CustomerAddress[]> {
  constructor(
    private readonly profiles: ICustomerProfileRepository,
    private readonly addresses: ICustomerAddressRepository,
  ) {}

  async execute(userId: string): Promise<CustomerAddress[]> {
    const profile = await getCustomerProfile(this.profiles, userId);
    return this.addresses.findManyByCustomerId(profile.id);
  }
}
