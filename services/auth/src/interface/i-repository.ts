import { ListResult, Role } from "../config/enum.js";
import { CondUserDTO, CreateUserDTO, PagingDTO, UpdateUserDTO } from "../model/dto.js";
import { User } from "../model/user.js";

export interface IUserCommandRepository {
  insert(data: CreateUserDTO): Promise<boolean>;
  update(id: string, data: UpdateUserDTO): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

export interface IUserQueryRepository {
  get(id: string): Promise<User | null>;
  list(cond: CondUserDTO, paging: PagingDTO): Promise<ListResult<User>>;
  findByCond(cond: CondUserDTO): Promise<User | null>;
}

export interface IUserRepository extends IUserCommandRepository, IUserQueryRepository {}

export interface TokenPayload {
  sub: string,
  role: Role
}

export interface Requester extends TokenPayload {}

export type TokenIntrospectResult = {
  payload: TokenPayload | null;
  error?: Error;
  isOk: boolean
}

export interface ITokenIntrospect {
  introspect(token: string): Promise<TokenIntrospectResult>
}