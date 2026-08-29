import crypto from "crypto";
import bcrypt from "bcrypt";
import { v7 } from "uuid";
import { google } from "googleapis";
import { oauth2client } from "../config/googleConfig.js";
import { Role, Status } from "../config/enum.js";
import { GoogleLoginCommand, IUserCommandHandler } from "../interface/i-command.js";
import { IUserRepository } from "../interface/i-repository.js";
import { GoogleLoginDTOSchema } from "../model/dto.js";
import { ErrGoogleAccountDoesNotHaveEmail, ErrInvalidGoogleLoginData, ErrUserNotFound } from "../model/error.js";
import { jwtProvider } from "../config/jwt.js";

export class GoogleLoginCmdHandler implements IUserCommandHandler<GoogleLoginCommand, string> {
  constructor(private readonly repository: IUserRepository) {}

  async execute(cmd: GoogleLoginCommand): Promise<string> {
    const result = GoogleLoginDTOSchema.safeParse(cmd);
    if (!result.success) {
      throw ErrInvalidGoogleLoginData;
    }

    const { tokens } = await oauth2client.getToken(cmd.code);

    // Attach a token to the oauth client
    oauth2client.setCredentials(tokens);

    // Get user information from google
    const oauth2 = google.oauth2({
      version: "v2",
      auth: oauth2client
    });

    const { data } = await oauth2.userinfo.get();
    const email = data.email;
    if (!email || data.verified_email !== true) {
      throw ErrGoogleAccountDoesNotHaveEmail;
    }

    let user = await this.repository.findByCond({ email });
    if (!user) {
      const id = v7();
      const randomPassword = crypto.randomUUID();
      const hashPassword = bcrypt.hashSync(randomPassword, 10);
      const name = [data.given_name, data.family_name].filter(Boolean).join(" ");
      const image = data.picture || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

      const newUser = {
        id,
        name,
        email,
        password: hashPassword,
        image,
        status: Status.ACTIVE,
        role: Role.CUSTOMER
      };

      try {
        await this.repository.insert(newUser);
        user = await this.repository.get(id);
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) {
          throw error;
        }

        user = await this.repository.findByCond({ email });
      }

      if (!user) {
        throw ErrUserNotFound;
      }
    }

    if (user.status === Status.DELETED) {
      throw ErrUserNotFound;
    }

    const token = await jwtProvider.generateToken({ sub: user.id, role: user.role });
    return token;
  }
}