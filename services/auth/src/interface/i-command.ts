import { LoginUserDTO } from "../model/dto.js";

export interface LoginUserCommand {
  cmd: LoginUserDTO
}

export interface IUserCommandHandler<Command, Result> {
  execute(cmd: Command): Promise<Result>;
}