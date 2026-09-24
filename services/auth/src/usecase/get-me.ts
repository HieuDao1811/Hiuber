import {
  GetMeQuery,
  IAuthQueryHandler,
  IAuthRepository,
} from "../interface/index.js";
import { ErrUserDeleted, ErrUserNotFound } from "../model/errors.js";
import { PublicUser, toPublicUser } from "../model/user.js";
import { UserStatus } from "../share/enums/index.js";

export class GetMeQueryHandler
  implements IAuthQueryHandler<GetMeQuery, PublicUser>
{
  constructor(private readonly repository: IAuthRepository) {}
  async query(query: GetMeQuery): Promise<PublicUser> {
    const user = await this.repository.findById(query.id);
    if (!user) {
      throw ErrUserNotFound;
    }

    if (user.status === UserStatus.DELETED) {
      throw ErrUserDeleted;
    }

    return toPublicUser(user);
  }
}
