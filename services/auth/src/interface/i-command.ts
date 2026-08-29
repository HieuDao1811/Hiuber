import { LoginUserDTO, RegisterUserDTO } from "../model/dto.js";

export interface LoginUserCommand {
  cmd: LoginUserDTO
}

export interface RegisterUserCommand {
  cmd: RegisterUserDTO
}

export interface GoogleLoginCommand {
  code: string;
}

export interface IUserCommandHandler<Command, Result> {
  execute(cmd: Command): Promise<Result>;
}