export type RefreshToken = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
};

export type CreateRefreshTokenRecord = Pick<
  RefreshToken,
  "userId" | "token" | "expiresAt"
>;
