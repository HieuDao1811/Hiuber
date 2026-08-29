import { GoogleLoginCommand, IUserCommandHandler, LoginUserCommand } from "../../interface/i-command.js";
import { IUserQueryHandler, ProfileQuery } from "../../interface/i-query.js";
import { Requester } from "../../interface/i-repository.js";
import { User } from "../../model/user.js";
import { RegisterUserCmdHandler } from "../../use-case/register-user.js";
import { Request, Response } from "express";
export class UserHttpService {
  constructor(
    private readonly loginUserCmdHandler: IUserCommandHandler<LoginUserCommand, string>,
    private readonly registerUserCmdHandler: RegisterUserCmdHandler,
    private readonly profileQueryHandler: IUserQueryHandler<ProfileQuery, User>,
    private readonly googleLoginCmdHandler?: IUserCommandHandler<GoogleLoginCommand, string>
  ) {}

  async loginAPI(req: Request, res: Response) {
    try {
      const token = await this.loginUserCmdHandler.execute({cmd: req.body });
      res.status(200).json({ data: token });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async registerAPI(req: Request, res: Response) {
    try {
      const userId = await this.registerUserCmdHandler.execute({cmd: req.body });
      res.status(201).json({ data: userId });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async googleLoginAPI(req: Request, res: Response) {
    try {
      const { code } = req.body;
      if (!this.googleLoginCmdHandler) {
        throw new Error("Google login handler is not configured");
      }
      const token = await this.googleLoginCmdHandler.execute({ code });
      res.status(200).json({ data: token });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async profileAPI(req: Request, res: Response) {
    try {
      const requester = res.locals.requester as Requester;

      const user = await this.profileQueryHandler.query({ id: requester.sub });
      console.log("RESULT:", user);
      const { password, role, ...profile } = user;
      res.status(200).json({ data: profile });
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  }
}