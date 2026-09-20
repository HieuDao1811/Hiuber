import { Router } from "express";
import { RegisterCommandHandler } from "../usecase/register.js";
import { AuthHttpService } from "../infras/transport/http-service.js";
import { GetMeQueryHandler } from "../usecase/get-me.js";
import { LoginCommandHandler } from "../usecase/login.js";
import { RefreshTokenCommandHandler } from "../usecase/refresh-token.js";
import { LogoutCommandHandler } from "../usecase/logout.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  AuthRepository,
  RefreshTokenRepository,
} from "../infras/repository/prisma/index.js";

export const setUpAuthHexagon = () => {
  const repository = new AuthRepository();
  const refreshTokenRepository = new RefreshTokenRepository();

  const registerCommandHandler = new RegisterCommandHandler(repository);
  const loginCommandHandler = new LoginCommandHandler(
    repository,
    refreshTokenRepository,
  );
  const getMeQueryHandler = new GetMeQueryHandler(repository);
  const refreshTokenCommandHandler = new RefreshTokenCommandHandler(
    repository,
    refreshTokenRepository,
  );
  const logoutCommandHandler = new LogoutCommandHandler(
    refreshTokenRepository,
  );

  const httpService = new AuthHttpService(
    registerCommandHandler,
    loginCommandHandler,
    getMeQueryHandler,
    refreshTokenCommandHandler,
    logoutCommandHandler,
  );

  const router = Router();
  router.post("/auth/register", httpService.register.bind(httpService));
  router.post("/auth/login", httpService.login.bind(httpService));
  router.post("/auth/refresh-token", httpService.refreshToken.bind(httpService));
  router.post("/auth/logout", httpService.logout.bind(httpService));
  router.get("/auth/me", authenticate, httpService.getMe.bind(httpService));
  return router;
}
