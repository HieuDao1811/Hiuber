import type { Requester } from "../model/requester.js";

export interface IAuthService {
  verifyAccessToken(accessToken: string): Promise<Requester>;
}
