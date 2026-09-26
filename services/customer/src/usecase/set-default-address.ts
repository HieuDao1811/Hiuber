import type { CommandHandler } from "../interface/command-handler.js";
import type { ICustomerAddressRepository } from "../interface/repository/customer-address.repository.js";
import type { ICustomerProfileRepository } from "../interface/repository/customer-profile.repository.js";
import type { CustomerAddress } from "../model/customer-address.js";
import { Errors } from "../shared/app-error.js";
import { getCustomerProfile } from "./customer-access.js";

interface SetDefaultAddressCommand {
  userId: string;
  addressId: string;
}

export class SetDefaultAddress
  implements CommandHandler<SetDefaultAddressCommand, CustomerAddress>
{
  constructor(
    private readonly profiles: ICustomerProfileRepository,
    private readonly addresses: ICustomerAddressRepository,
  ) {}

  async execute(command: SetDefaultAddressCommand): Promise<CustomerAddress> {
    const profile = await getCustomerProfile(this.profiles, command.userId);
    const address = await this.addresses.setDefault(
      command.addressId,
      profile.id,
    );

    if (!address) {
      throw Errors.addressNotFound();
    }

    return address;
  }
}
