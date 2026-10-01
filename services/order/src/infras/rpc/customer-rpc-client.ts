import { z } from "zod";
import type {
  CustomerAddressSnapshot,
  ICustomerService,
} from "../../interface/customer-service.js";
import {
  AddressNotFoundError,
  DependencyUnavailableError,
  ForbiddenError,
  InvalidAccessTokenError,
} from "../../model/errors.js";

const AddressSchema = z.object({
  id: z.uuid(),
  label: z.string().nullable(),
  receiverName: z.string().min(1),
  receiverPhone: z.string().min(1),
  address: z.string().min(1),
});

const AddressResponseSchema = z.object({
  data: AddressSchema,
});

export class CustomerRpcClient implements ICustomerService {
  private readonly customerServiceUrl: URL;

  constructor(
    customerServiceUrl: string,
    private readonly requestTimeoutMs = 5_000,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.customerServiceUrl = new URL(customerServiceUrl);
  }

  async getOwnedAddress(
    accessToken: string,
    addressId: string,
  ): Promise<CustomerAddressSnapshot> {
    let response: Response;
    const addressUrl = new URL(
      `/v1/customers/me/addresses/${encodeURIComponent(addressId)}`,
      this.customerServiceUrl,
    );

    try {
      response = await this.fetcher(addressUrl, {
        headers: { authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(this.requestTimeoutMs),
      });
    } catch {
      throw new DependencyUnavailableError("CUSTOMER");
    }

    if (response.status === 401) {
      throw new InvalidAccessTokenError();
    }
    if (response.status === 403) {
      throw new ForbiddenError("Customer access is required");
    }
    if (response.status === 404) {
      throw new AddressNotFoundError();
    }
    if (!response.ok) {
      throw new DependencyUnavailableError("CUSTOMER");
    }

    let address: z.infer<typeof AddressSchema>;
    try {
      address = AddressResponseSchema.parse(await response.json()).data;
    } catch {
      throw new DependencyUnavailableError("CUSTOMER");
    }

    if (address.id !== addressId) {
      throw new DependencyUnavailableError("CUSTOMER");
    }

    return {
      label: address.label,
      receiverName: address.receiverName,
      receiverPhone: address.receiverPhone,
      address: address.address,
    };
  }
}
