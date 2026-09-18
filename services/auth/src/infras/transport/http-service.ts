import { Request, Response } from "express";
import { RegisterCommandHandler } from "../../usecase/register.js";

export class AuthHttpService {
  constructor(private readonly registerCmd: RegisterCommandHandler) {}

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
}