import { randomUUID } from "node:crypto";
import type { CommandHandler } from "../interface/command-handler.js";
import type { ICustomerAddressRepository } from "../interface/repository/customer-address.repository.js";
import type { ICustomerProfileRepository } from "../interface/repository/customer-profile.repository.js";
import type {
  CreateAddressInput,
  CustomerAddress,
} from "../model/customer-address.js";
import { getCustomerProfile } from "./customer-access.js";

interface CreateAddressCommand {
  userId: string;
  input: CreateAddressInput;
}

export class CreateAddress
  implements CommandHandler<CreateAddressCommand, CustomerAddress>
{
  constructor(
    private readonly profiles: ICustomerProfileRepository,
    private readonly addresses: ICustomerAddressRepository,
  ) {}

  async execute(command: CreateAddressCommand): Promise<CustomerAddress> {
    const profile = await getCustomerProfile(this.profiles, command.userId);

    return this.addresses.create({
      id: randomUUID(),
      customerId: profile.id,
      ...command.input,
    });
  }
}
