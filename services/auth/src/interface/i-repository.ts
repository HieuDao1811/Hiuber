import { ListResult } from "../config/enum.js";
import { CondUserDTO, PagingDTO, UpdateUserDTO } from "../model/dto.js";
import { User } from "../model/user.js";

export interface IUserCommandRepository {
  insert(data: User): Promise<User>;
  update(id: string, data: UpdateUserDTO): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

export interface IUserQueryRepository {
  get(id: string): Promise<User | null>;
  list(cond: CondUserDTO, paging: PagingDTO): Promise<ListResult<User>>;
  findByCond(cond: CondUserDTO): Promise<User | null>;
}

export interface IUserRepository extends IUserCommandRepository, IUserQueryRepository {}