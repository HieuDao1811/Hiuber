import {
  IAuthQueryHandler,
  ITokenService,
  TokenPayload,
  VerifyAccessTokenQuery,
} from "../interface/index.js";
import { ErrInvalidAccessToken } from "../model/errors.js";
import {
  TokenPayloadSchema,
  VerifyAccessTokenSchema,
} from "../model/user.dto.js";

export class VerifyAccessTokenQueryHandler
  implements IAuthQueryHandler<VerifyAccessTokenQuery, TokenPayload>
{
  constructor(private readonly tokenService: ITokenService) {}

  async query(query: VerifyAccessTokenQuery): Promise<TokenPayload> {
    const { accessToken } = VerifyAccessTokenSchema.parse(query);

    try {
      const payload = this.tokenService.verifyAccessToken(accessToken);
      return TokenPayloadSchema.parse(payload);
    } catch {
      throw ErrInvalidAccessToken;
    }
  }
}
