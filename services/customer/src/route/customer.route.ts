import { Router } from "express";
import { CustomerHttpService } from "../infras/transport/customer-http-service.js";
import type { IAuthService } from "../interface/auth-service.js";
import type { ICustomerAddressRepository } from "../interface/repository/customer-address.repository.js";
import type { ICustomerProfileRepository } from "../interface/repository/customer-profile.repository.js";
import { authenticate, authorizeCustomer } from "../middleware/auth.middleware.js";
import { CreateAddressCommandHandler } from "../usecase/create-address.js";
import { CreateMyProfileCommandHandler } from "../usecase/create-my-profile.js";
import { DeleteAddressCommandHandler } from "../usecase/delete-address.js";
import { GetMyProfileQueryHandler } from "../usecase/get-my-profile.js";
import { GetAddressQueryHandler } from "../usecase/get-address.js";
import { ListAddressesQueryHandler } from "../usecase/list-addresses.js";
import { SetDefaultAddressCommandHandler } from "../usecase/set-default-address.js";
import { UpdateAddressCommandHandler } from "../usecase/update-address.js";
import { UpdateMyProfileCommandHandler } from "../usecase/update-my-profile.js";

export interface CustomerRouterDependencies {
  profiles: ICustomerProfileRepository;
  addresses: ICustomerAddressRepository;
  authService: IAuthService;
}

export const createCustomerRouter = (
  dependencies: CustomerRouterDependencies,
) => {
  const httpService = new CustomerHttpService({
    createMyProfile: new CreateMyProfileCommandHandler(dependencies.profiles),
    getMyProfile: new GetMyProfileQueryHandler(dependencies.profiles),
    updateMyProfile: new UpdateMyProfileCommandHandler(dependencies.profiles),
    listAddresses: new ListAddressesQueryHandler(
      dependencies.profiles,
      dependencies.addresses,
    ),
    getAddress: new GetAddressQueryHandler(
      dependencies.profiles,
      dependencies.addresses,
    ),
    createAddress: new CreateAddressCommandHandler(
      dependencies.profiles,
      dependencies.addresses,
    ),
    updateAddress: new UpdateAddressCommandHandler(
      dependencies.profiles,
      dependencies.addresses,
    ),
    deleteAddress: new DeleteAddressCommandHandler(
      dependencies.profiles,
      dependencies.addresses,
    ),
    setDefaultAddress: new SetDefaultAddressCommandHandler(
      dependencies.profiles,
      dependencies.addresses,
    ),
  });
  const router = Router();

  router.use(authenticate(dependencies.authService), authorizeCustomer);

  router.post("/me", httpService.createMyProfile.bind(httpService));
  router.get("/me", httpService.getMyProfile.bind(httpService));
  router.patch("/me", httpService.updateMyProfile.bind(httpService));
  router.get(
    "/me/addresses",
    httpService.listAddresses.bind(httpService),
  );
  router.get(
    "/me/addresses/:addressId",
    httpService.getAddress.bind(httpService),
  );
  router.post(
    "/me/addresses",
    httpService.createAddress.bind(httpService),
  );
  router.patch(
    "/me/addresses/:addressId",
    httpService.updateAddress.bind(httpService),
  );
  router.delete(
    "/me/addresses/:addressId",
    httpService.deleteAddress.bind(httpService),
  );
  router.patch(
    "/me/addresses/:addressId/default",
    httpService.setDefaultAddress.bind(httpService),
  );

  return router;
};
