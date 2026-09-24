import { Request, Response } from "express";
import { RegisterCommandHandler } from "../../usecase/register.js";
import { GetMeQueryHandler } from "../../usecase/get-me.js";
import { LoginCommandHandler } from "../../usecase/login.js";
import { LogoutCommandHandler } from "../../usecase/logout.js";
import { RefreshTokenCommandHandler } from "../../usecase/refresh-token.js";
import { jwtProvider } from "../../share/config/jwt.js";

export class AuthHttpService {
  constructor(
    private readonly registerCmd: RegisterCommandHandler,
    private readonly loginCmd: LoginCommandHandler,
    private readonly getMeQuery: GetMeQueryHandler,

    private readonly refreshTokenCmd: RefreshTokenCommandHandler,
    private readonly logoutCmd: LogoutCommandHandler,
  ) {}

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/v1/auth",
      maxAge: jwtProvider.getExpiresAt(refreshToken).getTime() - Date.now(),
    });
  }

  async register(req: Request, res: Response) {
    const data = await this.registerCmd.execute({ command: req.body });
    return res.status(201).json({ data });
  }

  async login(req: Request, res: Response) {
    const data = await this.loginCmd.execute({ command: req.body });
    this.setRefreshTokenCookie(res, data.refreshToken);

    return res.status(200).json({
      data: { accessToken: data.accessToken },
    });
  }

  async refreshToken(req: Request, res: Response) {
    const data = await this.refreshTokenCmd.execute({
      command: { refreshToken: req.cookies.refreshToken },
    });
    this.setRefreshTokenCookie(res, data.refreshToken);

    return res.status(200).json({
      data: { accessToken: data.accessToken },
    });
  }

  async logout(req: Request, res: Response) {
    await this.logoutCmd.execute({
      command: { refreshToken: req.cookies.refreshToken },
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/v1/auth",
    });

    return res.status(204).send();
  }

  async getMe(req: Request, res: Response) {
    const { sub: id } = res.locals.requester;
    const data = await this.getMeQuery.query({ id });
    return res.status(200).json({ data });
  }
}
