import { Router } from "express"
import { UserHttpService } from "../infras/transport/http-service.js";
import { LoginUserCmdHandler } from "../use-case/login-user.js";
import { UserRepository } from "../infras/repository/user.repository.js";

export const authRouter = () => {
  const router = Router();

  const repository = new UserRepository();

  const loginUserCmdHandler = new LoginUserCmdHandler(repository);

  const httpService = new UserHttpService(
    loginUserCmdHandler
  )

  router.post("/v1/auth/login", httpService.loginAPI.bind(httpService));

  return router;
}