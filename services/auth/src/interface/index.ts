import { CreateUser, Login } from "../model/user.dto.js";
import { RefreshToken } from "../model/refresh-token.js";
import { User } from "../model/user.js";
import { Role } from "../share/enums/index.js";

export interface IUseCase {}

export interface IAuthRepository {
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

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenCommand {
  command: {
    refreshToken: string
  }
}

export interface LogoutCommand {
  command: {
    refreshToken: string;
  };
}

export interface IAuthCommandHandler<Command, Result> {
  execute(command: Command): Promise<Result>;
}

export interface IAuthQueryHandler<Query, Result> {
  query(query: Query): Promise<Result>;
}

export interface TokenPayload {
  sub: string,
  role: Role
}

// Command
export interface CreateCommand {
  command: CreateUser
}

export interface LoginCommand {
  command: Login
}

// Query
export interface GetMeQuery {
  id: string
}