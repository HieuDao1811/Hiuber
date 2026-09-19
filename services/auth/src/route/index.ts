import { Router } from "express";
import { RegisterCommandHandler } from "../usecase/register.js";
import { AuthHttpService } from "../infras/transport/http-service.js";
import { GetMeQueryHandler } from "../usecase/getMe.js";
import { LoginCommandHandler } from "../usecase/login.js";
import { authenticate } from "../middlewares/auth.middleware.js";

export const setUpAuthHexagon = () => {
  const repository = new AuthRepository();

  const registerCommandHandler = new RegisterCommandHandler(repository);
  const loginCommandHandler = new LoginCommandHandler(repository);
  const getMeQueryHandler = new GetMeQueryHandler(repository);

  const httpService = new AuthHttpService(
    registerCommandHandler,
    loginCommandHandler,
    getMeQueryHandler,
  );

  const router = Router();
  router.post("/auth/register", httpService.register.bind(httpService));
  router.post("/auth/login", httpService.login.bind(httpService));
  router.get("/auth/me", authenticate, httpService.getMe.bind(httpService));
  return router;
}