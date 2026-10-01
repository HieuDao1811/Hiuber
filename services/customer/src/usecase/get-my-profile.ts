import type { QueryHandler } from "../interface/query-handler.js";
import type { ICustomerProfileRepository } from "../interface/repository/customer-profile.repository.js";
import type { CustomerProfile } from "../model/customer-profile.js";
import { getCustomerProfile } from "./customer-access.js";

export class GetMyProfileQueryHandler
  implements QueryHandler<string, CustomerProfile>
{
  constructor(private readonly repository: ICustomerProfileRepository) {}

  query(userId: string): Promise<CustomerProfile> {
    return getCustomerProfile(this.repository, userId);
  }
}
