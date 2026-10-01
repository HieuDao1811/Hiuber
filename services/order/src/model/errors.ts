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
  constructor(message = "Forbidden") {
    super("FORBIDDEN", message, 403);
  }
}

export class DependencyUnavailableError extends AppError {
  constructor(service: "AUTH" | "CUSTOMER" | "RESTAURANT") {
    super(
      `${service}_SERVICE_UNAVAILABLE`,
      `${service[0]}${service.slice(1).toLowerCase()} service unavailable`,
      503,
    );
  }
}

export class InvalidInternalServiceKeyError extends AppError {
  constructor() {
    super("INVALID_INTERNAL_SERVICE_KEY", "Unauthorized", 401);
  }
}

export class PaymentMethodConflictError extends AppError {
  constructor() {
    super(
      "PAYMENT_METHOD_CONFLICT",
      "Order is already associated with a different payment method",
      409,
    );
  }
}

export class PaymentStatusConflictError extends AppError {
  constructor() {
    super(
      "PAYMENT_STATUS_CONFLICT",
      "A paid order cannot be changed back to unpaid",
      409,
    );
  }
}

export class AddressNotFoundError extends AppError {
  constructor() {
    super("ADDRESS_NOT_FOUND", "Customer address not found", 404);
  }
}

export class RestaurantNotFoundError extends AppError {
  constructor() {
    super("RESTAURANT_NOT_FOUND", "Restaurant not found", 404);
  }
}

export class RestaurantClosedError extends AppError {
  constructor() {
    super(
      "RESTAURANT_NOT_ACCEPTING_ORDERS",
      "Restaurant is not accepting orders",
      409,
    );
  }
}

export class MenuItemNotFoundError extends AppError {
  constructor(menuItemId: string) {
    super("MENU_ITEM_NOT_FOUND", `Menu item not found: ${menuItemId}`, 404);
  }
}

export class MenuItemUnavailableError extends AppError {
  constructor(menuItemId: string) {
    super("MENU_ITEM_UNAVAILABLE", `Menu item is unavailable: ${menuItemId}`, 409);
  }
}

export class MenuItemRestaurantMismatchError extends AppError {
  constructor(menuItemId: string) {
    super(
      "MENU_ITEM_RESTAURANT_MISMATCH",
      `Menu item does not belong to the restaurant: ${menuItemId}`,
      400,
    );
  }
}

export class OrderNotFoundError extends AppError {
  constructor() {
    super("ORDER_NOT_FOUND", "Order not found", 404);
  }
}

export class InvalidOrderStatusTransitionError extends AppError {
  constructor() {
    super(
      "INVALID_ORDER_STATUS_TRANSITION",
      "Order status transition is not allowed",
      409,
    );
  }
}

export class ConcurrentOrderUpdateError extends AppError {
  constructor() {
    super(
      "ORDER_STATUS_CHANGED",
      "Order status changed; reload the order before retrying",
      409,
    );
  }
}

export class NotificationNotFoundError extends AppError {
  constructor() {
    super("NOTIFICATION_NOT_FOUND", "Notification not found", 404);
  }
}
