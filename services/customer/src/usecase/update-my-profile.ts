import type { CommandHandler } from "../interface/command-handler.js";
import type { ICustomerProfileRepository } from "../interface/repository/customer-profile.repository.js";
import type {
  CustomerProfile,
  UpdateCustomerProfileInput,
} from "../model/customer-profile.js";
import { CustomerProfileNotFoundError } from "../model/errors.js";

interface UpdateMyProfileCommand {
  userId: string;
  input: UpdateCustomerProfileInput;
}

export class UpdateMyProfileCommandHandler
  implements CommandHandler<UpdateMyProfileCommand, CustomerProfile>
{
  constructor(private readonly repository: ICustomerProfileRepository) {}

  async execute(command: UpdateMyProfileCommand): Promise<CustomerProfile> {
    const profile = await this.repository.updateByUserId(
      command.userId,
      command.input,
    );

    if (!profile) {
      throw new CustomerProfileNotFoundError();
    }

    return profile;
  }
}
