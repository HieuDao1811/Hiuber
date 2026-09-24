import { AppError } from "../share/components/app-error.js";

export class UnauthenticatedError extends AppError {
  constructor(message = "Unauthorized") {
    super("UNAUTHENTICATED", message, 401);
  }
}

export class InvalidAccessTokenError extends AppError {
  constructor() {
    super("INVALID_ACCESS_TOKEN", "Invalid or expired access token", 401);
    this.name = "InvalidAccessTokenError";
  }
}

export class AuthServiceUnavailableError extends AppError {
  constructor() {
    super(
      "AUTH_SERVICE_UNAVAILABLE",
      "Authentication service unavailable",
      503,
    );
    this.name = "AuthServiceUnavailableError";
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super("FORBIDDEN", "You do not own this restaurant", 403);
  }
}

export class RestaurantNotFoundError extends AppError {
  constructor() {
    super("RESTAURANT_NOT_FOUND", "Restaurant not found", 404);
  }
}

export class RestaurantAlreadyExistsError extends AppError {
  constructor() {
    super(
      "RESTAURANT_ALREADY_EXISTS",
      "Restaurant already exists for this owner",
      409,
    );
  }
}

export class InvalidRestaurantStatusError extends AppError {
  constructor() {
    super(
      "INVALID_RESTAURANT_STATUS",
      "Use the delete endpoint to set a restaurant as deleted",
      400,
    );
  }
}
