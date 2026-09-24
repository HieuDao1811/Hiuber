import {
  IAuthQueryHandler,
  IAuthRepository,
  ITokenService,
  TokenPayload,
  VerifyAccessTokenQuery,
} from "../interface/index.js";
import { ErrInvalidAccessToken } from "../model/errors.js";
import {
  TokenPayloadSchema,
  VerifyAccessTokenSchema,
} from "../model/user.dto.js";
import { UserStatus } from "../share/enums/index.js";

export class VerifyAccessTokenQueryHandler
  implements IAuthQueryHandler<VerifyAccessTokenQuery, TokenPayload>
{
  constructor(
    private readonly tokenService: ITokenService,
    private readonly userRepository: IAuthRepository,
  ) {}

  async query(query: VerifyAccessTokenQuery): Promise<TokenPayload> {
    const { accessToken } = VerifyAccessTokenSchema.parse(query);

    let payload: TokenPayload;
    try {
      payload = TokenPayloadSchema.parse(
        this.tokenService.verifyAccessToken(accessToken),
      );
    } catch {
      throw ErrInvalidAccessToken;
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw ErrInvalidAccessToken;
    }

    return { sub: user.id, role: user.role };
  }
}
