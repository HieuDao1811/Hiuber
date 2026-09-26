import type { Request, Response } from "express";
import { RequesterSchema } from "../interface/requester.js";
import {
  AddressIdParamsSchema,
  CreateCustomerAddressSchema,
  UpdateCustomerAddressSchema,
} from "../model/customer-address.js";
import { UpdateCustomerProfileSchema } from "../model/customer-profile.js";
import type { CreateAddress } from "../usecase/create-address.js";
import type { DeleteAddress } from "../usecase/delete-address.js";
import type { GetMyProfile } from "../usecase/get-my-profile.js";
import type { ListAddresses } from "../usecase/list-addresses.js";
import type { SetDefaultAddress } from "../usecase/set-default-address.js";
import type { UpdateAddress } from "../usecase/update-address.js";
import type { UpdateMyProfile } from "../usecase/update-my-profile.js";
import { sendData } from "../shared/response.js";

export interface CustomerUseCases {
  getMyProfile: GetMyProfile;
  updateMyProfile: UpdateMyProfile;
  listAddresses: ListAddresses;
  createAddress: CreateAddress;
  updateAddress: UpdateAddress;
  deleteAddress: DeleteAddress;
  setDefaultAddress: SetDefaultAddress;
}

const getUserId = (response: Response) =>
  RequesterSchema.parse(response.locals.requester).userId;

export class CustomerController {
  constructor(private readonly useCases: CustomerUseCases) {}

  getMyProfile = async (_request: Request, response: Response) => {
    const profile = await this.useCases.getMyProfile.execute(
      getUserId(response),
    );
    return sendData(response, profile);
  };

  updateMyProfile = async (request: Request, response: Response) => {
    const input = UpdateCustomerProfileSchema.parse(request.body);
    const result = await this.useCases.updateMyProfile.execute({
      userId: getUserId(response),
      input,
    });

    return sendData(response, result.profile, result.created ? 201 : 200);
  };

  listAddresses = async (_request: Request, response: Response) => {
    const addresses = await this.useCases.listAddresses.execute(
      getUserId(response),
    );
    return sendData(response, addresses);
  };

  createAddress = async (request: Request, response: Response) => {
    const input = CreateCustomerAddressSchema.parse(request.body);
    const address = await this.useCases.createAddress.execute({
      userId: getUserId(response),
      input,
    });

    return sendData(response, address, 201);
  };

  updateAddress = async (request: Request, response: Response) => {
    const { addressId } = AddressIdParamsSchema.parse(request.params);
    const input = UpdateCustomerAddressSchema.parse(request.body);
    const address = await this.useCases.updateAddress.execute({
      userId: getUserId(response),
      addressId,
      input,
    });

    return sendData(response, address);
  };

  deleteAddress = async (request: Request, response: Response) => {
    const { addressId } = AddressIdParamsSchema.parse(request.params);
    await this.useCases.deleteAddress.execute({
      userId: getUserId(response),
      addressId,
    });

    return response.status(204).send();
  };

  setDefaultAddress = async (request: Request, response: Response) => {
    const { addressId } = AddressIdParamsSchema.parse(request.params);
    const address = await this.useCases.setDefaultAddress.execute({
      userId: getUserId(response),
      addressId,
    });

    return sendData(response, address);
  };
}
