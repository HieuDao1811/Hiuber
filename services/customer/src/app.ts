import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { CustomerController } from "./controller/customer.controller.js";
import type { ICustomerAddressRepository } from "./interface/repository/customer-address.repository.js";
import type { ICustomerProfileRepository } from "./interface/repository/customer-profile.repository.js";
import type { IAuthRpc } from "./interface/rpc/auth-rpc.js";
import { errorHandler } from "./middleware/error-handler.js";
import { createCustomerRouter } from "./route/customer.route.js";
import { AppError } from "./shared/app-error.js";
import { sendData } from "./shared/response.js";
import { CreateAddress } from "./usecase/create-address.js";
import { DeleteAddress } from "./usecase/delete-address.js";
import { GetMyProfile } from "./usecase/get-my-profile.js";
import { ListAddresses } from "./usecase/list-addresses.js";
import { SetDefaultAddress } from "./usecase/set-default-address.js";
import { UpdateAddress } from "./usecase/update-address.js";
import { UpdateMyProfile } from "./usecase/update-my-profile.js";

interface CustomerAppDependencies {
  profiles: ICustomerProfileRepository;
  addresses: ICustomerAddressRepository;
  authRpc: IAuthRpc;
}

export const createCustomerApp = (dependencies: CustomerAppDependencies) => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 100,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_request, response) =>
    sendData(response, { service: "customer", status: "ok" }),
  );

  const controller = new CustomerController({
    getMyProfile: new GetMyProfile(dependencies.profiles),
    updateMyProfile: new UpdateMyProfile(dependencies.profiles),
    listAddresses: new ListAddresses(
      dependencies.profiles,
      dependencies.addresses,
    ),
    createAddress: new CreateAddress(
      dependencies.profiles,
      dependencies.addresses,
    ),
    updateAddress: new UpdateAddress(
      dependencies.profiles,
      dependencies.addresses,
    ),
    deleteAddress: new DeleteAddress(
      dependencies.profiles,
      dependencies.addresses,
    ),
    setDefaultAddress: new SetDefaultAddress(
      dependencies.profiles,
      dependencies.addresses,
    ),
  });

  app.use(
    "/v1/customers",
    createCustomerRouter(controller, dependencies.authRpc),
  );

  app.use((_request, _response, next) =>
    next(new AppError(404, "ROUTE_NOT_FOUND", "Route was not found")),
  );
  app.use(errorHandler);

  return app;
};
