export interface CustomerAddressSnapshot {
  label: string | null;
  receiverName: string;
  receiverPhone: string;
  address: string;
}

export interface ICustomerService {
  getOwnedAddress(
    accessToken: string,
    addressId: string,
  ): Promise<CustomerAddressSnapshot>;
}
