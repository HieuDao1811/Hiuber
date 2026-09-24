import { AppError } from "../share/components/app-error.js";

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

export class AuthServiceUnavailableError extends AppError {
  constructor() {
    super(
      "AUTH_SERVICE_UNAVAILABLE",
      "Authentication service unavailable",
      503,
    );
  }
}

export class InsufficientRoleError extends AppError {
  constructor() {
    super("FORBIDDEN", "Forbidden", 403);
  }
}

export class RestaurantOwnershipError extends AppError {
  constructor() {
    super("FORBIDDEN", "You do not own this restaurant", 403);
  }
}

export class RestaurantNotFoundError extends AppError {
  constructor() {
    super("RESTAURANT_NOT_FOUND", "Restaurant not found", 404);
  }
}

export class MenuItemNotFoundError extends AppError {
  constructor() {
    super("MENU_ITEM_NOT_FOUND", "Menu item not found", 404);
  }
}
