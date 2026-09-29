import { Router } from "express";
import { PaymentHttpService } from "../infras/transport/payment-http-service.js";
import type { IAuthService } from "../interface/auth-service.js";
import type { IPaymentRepository } from "../interface/payment-repository.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { UserRole } from "../share/enums/index.js";
import type { CreatePaymentCommandHandler } from "../usecase/create-payment.js";
import { GetPaymentQueryHandler } from "../usecase/get-payment.js";

export const createPaymentRouter = (dependencies: {
  authService: IAuthService;
  payments: IPaymentRepository;
  createPayment: CreatePaymentCommandHandler;
}) => {
  const router = Router();
  const http = new PaymentHttpService(
    dependencies.createPayment,
    new GetPaymentQueryHandler(dependencies.payments),
  );
  router.use(authenticate(dependencies.authService), authorize(UserRole.CUSTOMER));
  router.post("/", http.create.bind(http));
  router.get("/:id", http.get.bind(http));
  return router;
};
