import { Request, Response } from "express";
import { RegisterCommandHandler } from "../../usecase/register.js";
import { GetMeQueryHandler } from "../../usecase/getMe.js";

export class AuthHttpService {
  constructor(
    private readonly registerCmd: RegisterCommandHandler,
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