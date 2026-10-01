import type { CustomerAddress } from "../../model/customer-address.js";

export interface CreateCustomerAddressData {
  customerId: string;
  label: string | null;
  receiverName: string;
  receiverPhone: string;
  address: string;
}

export interface UpdateCustomerAddressData {
  label?: string | null;
  receiverName?: string;
  receiverPhone?: string;
  address?: string;
}

export interface ICustomerAddressRepository {
  findManyByCustomerId(customerId: string): Promise<CustomerAddress[]>;
  findOwned(
    addressId: string,
    customerId: string,
  ): Promise<CustomerAddress | null>;
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
