import { AppError } from "../share/components/app-error.js";

export const ErrInvalidRegisterData = new AppError("Invalid register data", 400);
export const ErrEmailAlreadyExists = new AppError("Email already exists", 409);
export const ErrInvalidEmailOrPassword = new AppError("Invalid email or password", 401);
export const ErrUserNotFound = new AppError("User not found", 404);
export const ErrUserInactivatedOrDeleted = new AppError("User inactived or deleted", 403);
export const ErrInvalidRefreshToken = new AppError("Invalid or expired refresh token", 401);
export const ErrInvalidAccessToken = new AppError("Invalid or expired access token", 401);
