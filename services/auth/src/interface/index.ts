import { CreateUser } from "../model/user.dto.js";
import { RefreshToken } from "../model/refresh-token.js";
import { User } from "../model/user.js";

export interface IUseCase {}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: User): Promise<User>;
}

export interface IRefreshTokenRepository {
  create(token: RefreshToken): Promise<RefreshToken>;
  findByToken(token: string): Promise<RefreshToken | null>;
  revoke(token: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
}

export interface IUserCommandHandler<Command, Result> {
  execute(command: Command): Promise<Result>;
}

export interface IUserQueryHandler<Query, Result> {
  query(query: Query): Promise<Result>;
}

export interface CreateCommand {
  command: CreateUser
}