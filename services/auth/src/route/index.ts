import { Router } from "express";
import { RegisterCommandHandler } from "../usecase/register.js";
import { AuthHttpService } from "../infras/transport/http-service.js";

export const setUpAuthHexagon = () => {
  const repository = new AuthRepository();

  const registerCommandHandler = new RegisterCommandHandler(repository);

  const httpService = new AuthHttpService(
    registerCommandHandler
  );

  const router = Router();
  router.post("/register", httpService.register.bind(httpService));
  return router;
}