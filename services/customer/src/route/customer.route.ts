import { Router } from "express";
import type { CustomerController } from "../controller/customer.controller.js";
import type { IAuthRpc } from "../interface/rpc/auth-rpc.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeCustomer } from "../middleware/authorize.js";

export const createCustomerRouter = (
  controller: CustomerController,
  authRpc: IAuthRpc,
) => {
  const router = Router();

  router.use(authenticate(authRpc), authorizeCustomer);

  router.get("/me", controller.getMyProfile);
  router.patch("/me", controller.updateMyProfile);

  router.get("/me/addresses", controller.listAddresses);
  router.post("/me/addresses", controller.createAddress);
  router.patch("/me/addresses/:addressId", controller.updateAddress);
  router.delete("/me/addresses/:addressId", controller.deleteAddress);
  router.patch(
    "/me/addresses/:addressId/default",
    controller.setDefaultAddress,
  );

  return router;
};
