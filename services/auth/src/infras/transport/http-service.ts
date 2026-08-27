import { IUserCommandHandler, LoginUserCommand } from "../../interface/i-command.js";
import { Request, Response } from "express";
export class UserHttpService {
  constructor(
    private readonly loginUserCmdHandler: IUserCommandHandler<LoginUserCommand, string>
  ) {}

  async loginAPI(req: Request, res: Response) {
    try {
      const token = await this.loginUserCmdHandler.execute(req.body);
      res.status(200).json({ data: token });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}