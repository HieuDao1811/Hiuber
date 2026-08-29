import { Router } from "express"
import { UserHttpService } from "../infras/transport/http-service.js";
import { LoginUserCmdHandler } from "../use-case/login-user.js";
import { RegisterUserCmdHandler } from "../use-case/register-user.js";
import { ProfileQueryHandler } from "../use-case/profile.js";
import { GoogleLoginCmdHandler } from "../use-case/google-login.js";
import { UserRepository } from "../infras/repository/user.repository.js";
import { authMiddleware } from "../middlewares/auth.js";
import { jwtProvider } from "../config/jwt.js";

export const authRouter = () => {
  const router = Router();

  const repository = new UserRepository();

  const loginUserCmdHandler = new LoginUserCmdHandler(repository);
  const registerUserCmdHandler = new RegisterUserCmdHandler(repository);
  const profileQueryHandler = new ProfileQueryHandler(repository);
  const googleLoginCmdHandler = new GoogleLoginCmdHandler(repository);

  const httpService = new UserHttpService(
    loginUserCmdHandler,
    registerUserCmdHandler,
    profileQueryHandler,
    googleLoginCmdHandler
  );

  router.post("/v1/auth/login", httpService.loginAPI.bind(httpService));
  router.post("/v1/auth/register", httpService.registerAPI.bind(httpService));
  router.post("/v1/auth/google", httpService.googleLoginAPI.bind(httpService));
  router.get("/v1/auth/profile", authMiddleware(jwtProvider), httpService.profileAPI.bind(httpService));

  return router;
}