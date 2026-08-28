import { Status, Role } from "../config/enum.js";
import { IUserQueryHandler, ProfileQuery } from "../interface/i-query.js";
import { IUserQueryRepository } from "../interface/i-repository.js";
import { ErrUserNotFound } from "../model/error.js";
import { User } from "../model/user.js";

export class ProfileQueryHandler implements IUserQueryHandler<ProfileQuery, User> {
  constructor(private readonly repository: IUserQueryRepository) {}

  async query(query: ProfileQuery): Promise<User> {
    const result = await this.repository.get(query.id);

    if (!result) {
      throw ErrUserNotFound; 
    }

    return result;
  }
}