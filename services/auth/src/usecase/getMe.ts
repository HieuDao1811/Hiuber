import { GetMeQuery, IAuthQueryHandler, IAuthRepository } from "../interface/index.js";
import { ErrUserNotFound } from "../model/errors.js";
import { User } from "../model/user.js";

type GetMeResponse = Omit<User, "passwordHash" | "id" | "role">;

export class getMeQueryHandler implements IAuthQueryHandler<GetMeQuery, GetMeResponse> {
  constructor(private readonly repository: IAuthRepository) {}
  async query(query: GetMeQuery): Promise<GetMeResponse> {
    const user = await this.repository.findById(query.id);
    if (!user) {
      throw ErrUserNotFound;
    }

    const { id, passwordHash, role, ...otherProps } = user;
    return otherProps as GetMeResponse;
  }
}