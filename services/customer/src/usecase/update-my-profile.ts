import { randomUUID } from "node:crypto";
import type { CommandHandler } from "../interface/command-handler.js";
import type { ICustomerProfileRepository } from "../interface/repository/customer-profile.repository.js";
import type {
  CustomerProfile,
  UpdateMyProfileInput,
} from "../model/customer-profile.js";
import { Errors } from "../shared/app-error.js";

interface UpdateMyProfileCommand {
  userId: string;
  input: UpdateMyProfileInput;
}

export interface UpdateMyProfileResult {
  profile: CustomerProfile;
  created: boolean;
}

export class UpdateMyProfile
  implements CommandHandler<UpdateMyProfileCommand, UpdateMyProfileResult>
{
  constructor(private readonly profiles: ICustomerProfileRepository) {}

  async execute(command: UpdateMyProfileCommand): Promise<UpdateMyProfileResult> {
    const existing = await this.profiles.findByUserId(command.userId);

    if (existing) {
      const profile = await this.profiles.updateByUserId(
        command.userId,
        command.input,
      );

      return { profile, created: false };
    }

    if (!command.input.fullName) {
      throw Errors.profileNeedsFullName();
    }

    const profile = await this.profiles.create({
      id: randomUUID(),
      userId: command.userId,
      fullName: command.input.fullName,
      phone: command.input.phone ?? null,
    });

    return { profile, created: true };
  }
}
