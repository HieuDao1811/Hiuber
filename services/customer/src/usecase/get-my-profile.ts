import type { QueryHandler } from "../interface/query-handler.js";
import type { ICustomerProfileRepository } from "../interface/repository/customer-profile.repository.js";
import type { CustomerProfile } from "../model/customer-profile.js";
import { getCustomerProfile } from "./customer-access.js";

export class GetMyProfile implements QueryHandler<string, CustomerProfile> {
  constructor(private readonly profiles: ICustomerProfileRepository) {}

  execute(userId: string): Promise<CustomerProfile> {
    return getCustomerProfile(this.profiles, userId);
  }
}
