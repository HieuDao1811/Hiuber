export type RefreshToken = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
};