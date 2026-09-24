import { IAuthService } from "../../interface/index.js";
import {
  AuthServiceUnavailableError,
  InvalidAccessTokenError,
} from "../../model/errors.js";
import { Requester, RequesterSchema } from "../../model/requester.js";

export class AuthRpcClient implements IAuthService {
  private readonly verifyUrl: URL;

  constructor(
    authServiceUrl: string,
    private readonly requestTimeoutMs = 5_000,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.verifyUrl = new URL("/internal/auth/verify", authServiceUrl);
  }

  async verifyAccessToken(accessToken: string): Promise<Requester> {
    let response: Response;

    try {
      response = await this.fetcher(this.verifyUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessToken }),
        signal: AbortSignal.timeout(this.requestTimeoutMs),
      });
    } catch {
      throw new AuthServiceUnavailableError();
    }

    if (response.status === 401) {
      throw new InvalidAccessTokenError();
    }

    if (!response.ok) {
      throw new AuthServiceUnavailableError();
    }

    try {
      return RequesterSchema.parse(await response.json());
    } catch {
      throw new AuthServiceUnavailableError();
    }
  }
}
