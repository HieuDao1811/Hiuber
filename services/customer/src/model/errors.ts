import { AppError } from "../shared/app-error.js";

export class UnauthenticatedError extends AppError {
  constructor() {
    super("UNAUTHENTICATED", "Unauthorized", 401);
  }
}

export class InvalidAccessTokenError extends AppError {
  constructor() {
    super("INVALID_ACCESS_TOKEN", "Invalid or expired access token", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super("FORBIDDEN", "Customer access is required", 403);
  }
}

export class AuthServiceUnavailableError extends AppError {
  constructor() {
    super(
      "AUTH_SERVICE_UNAVAILABLE",
      "Authentication service unavailable",
      503,
    );
  }
}

export class CustomerProfileNotFoundError extends AppError {
  constructor() {
    super("CUSTOMER_PROFILE_NOT_FOUND", "Customer profile not found", 404);
  }
}

export class CustomerProfileConflictError extends AppError {
  constructor() {
    super("CUSTOMER_PROFILE_ALREADY_EXISTS", "Customer profile already exists", 409);
  }
}

export class CustomerAddressNotFoundError extends AppError {
  constructor() {
    super("CUSTOMER_ADDRESS_NOT_FOUND", "Customer address not found", 404);
  }
}
