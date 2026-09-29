import { AppError } from "../shared/app-error.js";

export class UnauthenticatedError extends AppError {
  constructor() { super("UNAUTHENTICATED", "Unauthorized", 401); }
}

export class InvalidAccessTokenError extends AppError {
  constructor() { super("INVALID_ACCESS_TOKEN", "Invalid or expired access token", 401); }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") { super("FORBIDDEN", message, 403); }
}

export class DependencyUnavailableError extends AppError {
  constructor(service: "AUTH" | "ORDER") {
    super(
      `${service}_SERVICE_UNAVAILABLE`,
      `${service[0]}${service.slice(1).toLowerCase()} service unavailable`,
      503,
    );
  }
}

export class OrderNotFoundError extends AppError {
  constructor() { super("ORDER_NOT_FOUND", "Order not found", 404); }
}

export class PaymentNotFoundError extends AppError {
  constructor() { super("PAYMENT_NOT_FOUND", "Payment not found", 404); }
}

export class OrderNotPayableError extends AppError {
  constructor(message = "Order is not eligible for payment") {
    super("ORDER_NOT_PAYABLE", message, 409);
  }
}

export class PaymentAlreadyExistsError extends AppError {
  constructor() {
    super(
      "PAYMENT_ALREADY_EXISTS",
      "An active or successful payment already exists for this order",
      409,
    );
  }
}

export class IdempotencyConflictError extends AppError {
  constructor() {
    super(
      "IDEMPOTENCY_KEY_REUSED",
      "Idempotency-Key was already used with a different request",
      422,
    );
  }
}
