import { Router } from "express";
import { RegisterCommandHandler } from "../usecase/register.js";
import { AuthHttpService } from "../infras/transport/http-service.js";
import { GetMeQueryHandler } from "../usecase/getMe.js";

export const setUpAuthHexagon = () => {
  const repository = new AuthRepository();

  const registerCommandHandler = new RegisterCommandHandler(repository);
  const getMeQueryHandler = new GetMeQueryHandler(repository);

  const httpService = new AuthHttpService(
    registerCommandHandler,
    getMeQueryHandler,
  );

  const router = Router();
  router.post("/register", httpService.register.bind(httpService));
  router.get("/me", httpService.getMe.bind(httpService));
  return router;
}