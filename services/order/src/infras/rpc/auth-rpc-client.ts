import type { IAuthService } from "../../interface/auth-service.js";
import {
  DependencyUnavailableError,
  InvalidAccessTokenError,
} from "../../model/errors.js";
import { AuthVerifyResponseSchema } from "../../model/requester.js";

export class AuthRpcClient implements IAuthService {
  private readonly verifyUrl: URL;

  constructor(
    authServiceUrl: string,
    private readonly requestTimeoutMs = 5_000,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.verifyUrl = new URL("/internal/auth/verify", authServiceUrl);
  }

  async verifyAccessToken(accessToken: string) {
    let response: Response;

    try {
      response = await this.fetcher(this.verifyUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessToken }),
        signal: AbortSignal.timeout(this.requestTimeoutMs),
      });
    } catch {
      throw new DependencyUnavailableError("AUTH");
    }

    if (response.status === 401) {
      throw new InvalidAccessTokenError();
    }
    if (!response.ok) {
      throw new DependencyUnavailableError("AUTH");
    }

    try {
      const payload = AuthVerifyResponseSchema.parse(await response.json());
      return { userId: payload.sub, role: payload.role };
    } catch {
      throw new DependencyUnavailableError("AUTH");
    }
  }
}
