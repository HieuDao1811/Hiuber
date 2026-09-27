import type { ICustomerProfileRepository } from "../interface/repository/customer-profile.repository.js";
import { CustomerProfileNotFoundError } from "../model/errors.js";

export const getCustomerProfile = async (
  repository: ICustomerProfileRepository,
  userId: string,
) => {
  const profile = await repository.findByUserId(userId);

  if (!profile) {
    throw new CustomerProfileNotFoundError();
  }

  return profile;
};
