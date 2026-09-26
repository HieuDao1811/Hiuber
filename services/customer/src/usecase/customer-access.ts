import type { ICustomerProfileRepository } from "../interface/repository/customer-profile.repository.js";
import { Errors } from "../shared/app-error.js";

export const getCustomerProfile = async (
  profiles: ICustomerProfileRepository,
  userId: string,
) => {
  const profile = await profiles.findByUserId(userId);

  if (!profile) {
    throw Errors.profileNotFound();
  }

  return profile;
};
