import type { CustomerProfile } from "../../model/customer-profile.js";

export interface CreateCustomerProfileData {
  userId: string;
  fullName: string;
  phone: string | null;
}

export interface UpdateCustomerProfileData {
  fullName?: string;
  phone?: string | null;
}

export interface ICustomerProfileRepository {
  findByUserId(userId: string): Promise<CustomerProfile | null>;
  create(data: CreateCustomerProfileData): Promise<CustomerProfile | null>;
  updateByUserId(
    userId: string,
    data: UpdateCustomerProfileData,
  ): Promise<CustomerProfile | null>;
}
