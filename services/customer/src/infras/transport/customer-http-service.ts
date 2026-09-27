import type { Request, Response } from "express";
import {
  AddressIdParamsSchema,
  CreateCustomerAddressSchema,
  EmptyBodySchema,
  UpdateCustomerAddressSchema,
} from "../../model/customer-address.js";
import {
  CreateCustomerProfileSchema,
  UpdateCustomerProfileSchema,
} from "../../model/customer-profile.js";
import { UnauthenticatedError } from "../../model/errors.js";
import { RequesterSchema } from "../../model/requester.js";
import { dataResponse } from "../../shared/http-response.js";
import type { CreateAddressCommandHandler } from "../../usecase/create-address.js";
import type { CreateMyProfileCommandHandler } from "../../usecase/create-my-profile.js";
import type { DeleteAddressCommandHandler } from "../../usecase/delete-address.js";
import type { GetMyProfileQueryHandler } from "../../usecase/get-my-profile.js";
import type { ListAddressesQueryHandler } from "../../usecase/list-addresses.js";
import type { SetDefaultAddressCommandHandler } from "../../usecase/set-default-address.js";
import type { UpdateAddressCommandHandler } from "../../usecase/update-address.js";
import type { UpdateMyProfileCommandHandler } from "../../usecase/update-my-profile.js";

export interface CustomerUseCases {
  createMyProfile: CreateMyProfileCommandHandler;
  getMyProfile: GetMyProfileQueryHandler;
  updateMyProfile: UpdateMyProfileCommandHandler;
  listAddresses: ListAddressesQueryHandler;
  createAddress: CreateAddressCommandHandler;
  updateAddress: UpdateAddressCommandHandler;
  deleteAddress: DeleteAddressCommandHandler;
  setDefaultAddress: SetDefaultAddressCommandHandler;
}

export class CustomerHttpService {
  constructor(private readonly useCases: CustomerUseCases) {}

  private getUserId(response: Response): string {
    const requester = RequesterSchema.safeParse(response.locals.requester);

    if (!requester.success) {
      throw new UnauthenticatedError();
    }

    return requester.data.userId;
  }

  async createMyProfile(request: Request, response: Response) {
    const input = CreateCustomerProfileSchema.parse(request.body);
    const profile = await this.useCases.createMyProfile.execute({
      userId: this.getUserId(response),
      input,
    });
    return response.status(201).json(dataResponse(profile));
  }

  async getMyProfile(_request: Request, response: Response) {
    const profile = await this.useCases.getMyProfile.query(
      this.getUserId(response),
    );
    return response.status(200).json(dataResponse(profile));
  }

  async updateMyProfile(request: Request, response: Response) {
    const input = UpdateCustomerProfileSchema.parse(request.body);
    const profile = await this.useCases.updateMyProfile.execute({
      userId: this.getUserId(response),
      input,
    });
    return response.status(200).json(dataResponse(profile));
  }

  async listAddresses(_request: Request, response: Response) {
    const addresses = await this.useCases.listAddresses.query(
      this.getUserId(response),
    );
    return response.status(200).json(dataResponse(addresses));
  }

  async createAddress(request: Request, response: Response) {
    const input = CreateCustomerAddressSchema.parse(request.body);
    const address = await this.useCases.createAddress.execute({
      userId: this.getUserId(response),
      input,
    });
    return response.status(201).json(dataResponse(address));
  }

  async updateAddress(request: Request, response: Response) {
    const { addressId } = AddressIdParamsSchema.parse(request.params);
    const input = UpdateCustomerAddressSchema.parse(request.body);
    const address = await this.useCases.updateAddress.execute({
      userId: this.getUserId(response),
      addressId,
      input,
    });
    return response.status(200).json(dataResponse(address));
  }

  async deleteAddress(request: Request, response: Response) {
    const { addressId } = AddressIdParamsSchema.parse(request.params);
    await this.useCases.deleteAddress.execute({
      userId: this.getUserId(response),
      addressId,
    });
    return response.status(204).send();
  }

  async setDefaultAddress(request: Request, response: Response) {
    const { addressId } = AddressIdParamsSchema.parse(request.params);
    EmptyBodySchema.parse(request.body ?? {});
    const address = await this.useCases.setDefaultAddress.execute({
      userId: this.getUserId(response),
      addressId,
    });
    return response.status(200).json(dataResponse(address));
  }
}
