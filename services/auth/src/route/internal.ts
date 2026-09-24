import { Router } from "express";
import { InternalAuthHttpService } from "../infras/transport/internal-auth-http-service.js";
import { jwtProvider } from "../share/config/jwt.js";
import { VerifyAccessTokenQueryHandler } from "../usecase/verify-access-token.js";
import { AuthRepository } from "../infras/repositories/index.js";

export const setUpInternalAuthHexagon = () => {
  const repository = new AuthRepository();
  const verifyAccessTokenQuery = new VerifyAccessTokenQueryHandler(
    jwtProvider,
    repository,
  );
  const httpService = new InternalAuthHttpService(verifyAccessTokenQuery);

  const router = Router();
  router.post(
    "/auth/verify",
    httpService.verifyAccessToken.bind(httpService),
  );
  return router;
};
