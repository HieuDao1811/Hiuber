import { Router } from "express";
import { InternalAuthHttpService } from "../infras/transport/internal-auth-http-service.js";
import { jwtProvider } from "../share/config/jwt.js";
import { VerifyAccessTokenQueryHandler } from "../usecase/verify-access-token.js";

export const setUpInternalAuthHexagon = () => {
  const verifyAccessTokenQuery = new VerifyAccessTokenQueryHandler(jwtProvider);
  const httpService = new InternalAuthHttpService(verifyAccessTokenQuery);

  const router = Router();
  router.post(
    "/auth/verify",
    httpService.verifyAccessToken.bind(httpService),
  );
  return router;
};
