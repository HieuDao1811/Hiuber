import type { CustomerAddress } from "../../model/customer-address.js";

export interface CreateCustomerAddressData {
  id: string;
  customerId: string;
  label: string;
  receiverName: string;
  receiverPhone: string;
  address: string;
  isDefault: boolean;
}

export interface UpdateCustomerAddressData {
  label?: string;
  receiverName?: string;
  receiverPhone?: string;
  address?: string;
  isDefault?: boolean;
}

export interface ICustomerAddressRepository {
  findManyByCustomerId(customerId: string): Promise<CustomerAddress[]>;
  create(data: CreateCustomerAddressData): Promise<CustomerAddress>;
  updateOwned(
    addressId: string,
    customerId: string,
    data: UpdateCustomerAddressData,
  ): Promise<CustomerAddress | null>;
  deleteOwned(addressId: string, customerId: string): Promise<boolean>;
  setDefault(
    addressId: string,
    customerId: string,
  ): Promise<CustomerAddress | null>;
}
