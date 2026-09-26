export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const Errors = {
  unauthenticated: () =>
    new AppError(401, "UNAUTHENTICATED", "Authentication is required"),
  invalidAccessToken: () =>
    new AppError(401, "INVALID_ACCESS_TOKEN", "Access token is invalid or expired"),
  authUnavailable: () =>
    new AppError(503, "AUTH_SERVICE_UNAVAILABLE", "Authentication service is unavailable"),
  insufficientRole: () =>
    new AppError(403, "INSUFFICIENT_ROLE", "Customer access is required"),
  profileNotFound: () =>
    new AppError(404, "CUSTOMER_PROFILE_NOT_FOUND", "Customer profile was not found"),
  profileNeedsFullName: () =>
    new AppError(
      400,
      "FULL_NAME_REQUIRED",
      "fullName is required when creating a customer profile",
    ),
  addressNotFound: () =>
    new AppError(404, "CUSTOMER_ADDRESS_NOT_FOUND", "Customer address was not found"),
};
