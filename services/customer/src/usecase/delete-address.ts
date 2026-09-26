import type { CommandHandler } from "../interface/command-handler.js";
import type { ICustomerAddressRepository } from "../interface/repository/customer-address.repository.js";
import type { ICustomerProfileRepository } from "../interface/repository/customer-profile.repository.js";
import { Errors } from "../shared/app-error.js";
import { getCustomerProfile } from "./customer-access.js";

interface DeleteAddressCommand {
  userId: string;
  addressId: string;
}

export class DeleteAddress implements CommandHandler<DeleteAddressCommand, void> {
  constructor(
    private readonly profiles: ICustomerProfileRepository,
    private readonly addresses: ICustomerAddressRepository,
  ) {}

  async execute(command: DeleteAddressCommand): Promise<void> {
    const profile = await getCustomerProfile(this.profiles, command.userId);
    const deleted = await this.addresses.deleteOwned(
      command.addressId,
      profile.id,
    );

    if (!deleted) {
      throw Errors.addressNotFound();
    }
  }
}
