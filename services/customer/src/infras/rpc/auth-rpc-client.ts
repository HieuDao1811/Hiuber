import { z } from "zod";
import type { IAuthRpc } from "../../interface/rpc/auth-rpc.js";
import { UserRole } from "../../interface/requester.js";
import { Errors } from "../../shared/app-error.js";

const AuthPayloadSchema = z.object({
  sub: z.uuid(),
  role: z.enum(UserRole),
});

export class AuthRpcClient implements IAuthRpc {
  constructor(private readonly authServiceUrl: string) {}

  async verify(accessToken: string) {
    let response: globalThis.Response;

    try {
      response = await fetch(`${this.authServiceUrl}/internal/auth/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessToken }),
        signal: AbortSignal.timeout(5_000),
      });
    } catch {
      throw Errors.authUnavailable();
    }

    if (response.status === 401) {
      throw Errors.invalidAccessToken();
    }

    if (!response.ok) {
      throw Errors.authUnavailable();
    }

    try {
      const payload = AuthPayloadSchema.parse(await response.json());
      return { userId: payload.sub, role: payload.role };
    } catch {
      throw Errors.authUnavailable();
    }
  }
}
