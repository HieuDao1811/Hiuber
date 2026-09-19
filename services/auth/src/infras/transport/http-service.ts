import { Request, Response } from "express";
import { RegisterCommandHandler } from "../../usecase/register.js";
import { GetMeQueryHandler } from "../../usecase/getMe.js";
import { LoginCommandHandler } from "../../usecase/login.js";
import { ErrInvalidEmailOrPassword, ErrUserInactivatedOrDeleted } from "../../model/errors.js";

export class AuthHttpService {
  constructor(
    private readonly registerCmd: RegisterCommandHandler,
    private readonly loginCmd: LoginCommandHandler,
    private readonly getMeQuery: GetMeQueryHandler,
  ) {}

  async register(req: Request, res: Response) {
    try {
      const data = await this.registerCmd.execute(req.body);
      res.status(201).json({ data: data });
    } catch (error) {
      res.status(400).json({ 
        message: (error as Error).message
      })
    }
  }

  async login(req: Request, res: Response) {
    try {
      const data = await this.loginCmd.execute({ command: req.body });
      res.status(200).json({ data: data });
    } catch (error) {
      if (error === ErrInvalidEmailOrPassword) {
        return res.status(401).json({
          message: (error as Error).message,
        });
      }

      if (error === ErrUserInactivatedOrDeleted) {
        return res.status(403).json({
          message: (error as Error).message,
        });
      }

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async getMe(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const data = await this.getMeQuery.query({ id });
      res.status(200).json({ data: data });
    } catch (error) {
      res.status(404).json({
        message: (error as Error).message
      })
    }
  }
}