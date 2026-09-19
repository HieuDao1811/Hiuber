import { Request, Response } from "express";
import { RegisterCommandHandler } from "../../usecase/register.js";
import { GetMeQueryHandler } from "../../usecase/getMe.js";
import { LoginCommandHandler } from "../../usecase/login.js";

export class AuthHttpService {
  constructor(
    private readonly registerCmd: RegisterCommandHandler,
    private readonly loginCmd: LoginCommandHandler,
    private readonly getMeQuery: GetMeQueryHandler,
  ) {}

  async register(req: Request, res: Response) {
    const data = await this.registerCmd.execute(req.body);
    return res.status(201).json({ data });
  }

  async login(req: Request, res: Response) {
    const data = await this.loginCmd.execute({ command: req.body });
    return res.status(200).json({ data });
  }

  async getMe(req: Request, res: Response) {
    const { sub: id } = res.locals.requester;
    const data = await this.getMeQuery.query({ id });
    return res.status(200).json({ data });
  }
}
