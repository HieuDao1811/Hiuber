import type { CommandHandler } from "../interface/command-handler.js";
import type { ICustomerAddressRepository } from "../interface/repository/customer-address.repository.js";
import type { ICustomerProfileRepository } from "../interface/repository/customer-profile.repository.js";
import type {
  CustomerAddress,
  UpdateCustomerAddressInput,
} from "../model/customer-address.js";
import { CustomerAddressNotFoundError } from "../model/errors.js";
import { getCustomerProfile } from "./customer-access.js";

interface UpdateAddressCommand {
  userId: string;
  addressId: string;
  input: UpdateCustomerAddressInput;
}

export class UpdateAddressCommandHandler
  implements CommandHandler<UpdateAddressCommand, CustomerAddress>
{
  constructor(
    private readonly profiles: ICustomerProfileRepository,
    private readonly addresses: ICustomerAddressRepository,
  ) {}

  async execute(command: UpdateAddressCommand): Promise<CustomerAddress> {
    const profile = await getCustomerProfile(this.profiles, command.userId);
    const address = await this.addresses.updateOwned(
      command.addressId,
      profile.id,
      command.input,
    );

    if (!address) {
      throw new CustomerAddressNotFoundError();
    }

    return address;
  }
}
