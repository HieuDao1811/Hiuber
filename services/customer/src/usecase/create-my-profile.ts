import type { CommandHandler } from "../interface/command-handler.js";
import type { ICustomerProfileRepository } from "../interface/repository/customer-profile.repository.js";
import type {
  CreateCustomerProfileInput,
  CustomerProfile,
} from "../model/customer-profile.js";
import { CustomerProfileConflictError } from "../model/errors.js";

interface CreateMyProfileCommand {
  userId: string;
  input: CreateCustomerProfileInput;
}

export class CreateMyProfileCommandHandler
  implements CommandHandler<CreateMyProfileCommand, CustomerProfile>
{
  constructor(private readonly repository: ICustomerProfileRepository) {}

  async execute(command: CreateMyProfileCommand): Promise<CustomerProfile> {
    const profile = await this.repository.create({
      userId: command.userId,
      fullName: command.input.fullName,
      phone: command.input.phone ?? null,
    });

    if (!profile) {
      throw new CustomerProfileConflictError();
    }

    return profile;
  }
}
