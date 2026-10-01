import type { CommandHandler } from "../interface/command-handler.js";
import type { ICustomerAddressRepository } from "../interface/repository/customer-address.repository.js";
import type { ICustomerProfileRepository } from "../interface/repository/customer-profile.repository.js";
import type {
  CreateCustomerAddressInput,
  CustomerAddress,
} from "../model/customer-address.js";
import { getCustomerProfile } from "./customer-access.js";

interface CreateAddressCommand {
  userId: string;
  input: CreateCustomerAddressInput;
}

export class CreateAddressCommandHandler
  implements CommandHandler<CreateAddressCommand, CustomerAddress>
{
  constructor(
    private readonly profiles: ICustomerProfileRepository,
    private readonly addresses: ICustomerAddressRepository,
  ) {}

  async execute(command: CreateAddressCommand): Promise<CustomerAddress> {
    const profile = await getCustomerProfile(this.profiles, command.userId);

    return this.addresses.create({
      customerId: profile.id,
      label: command.input.label ?? null,
      receiverName: command.input.receiverName,
      receiverPhone: command.input.receiverPhone,
      address: command.input.address,
    });
  }
}
