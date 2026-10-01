export enum UserRole {
  CUSTOMER = "CUSTOMER",
  RESTAURANT = "RESTAURANT",
  RIDER = "RIDER",
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PREPARING = "PREPARING",
  READY = "READY",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum OrderPaymentStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
}

export enum PaymentMethod {
  COD = "COD",
  MOCK_ONLINE = "MOCK_ONLINE",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
}

export enum OrderSyncStatus {
  NOT_REQUIRED = "NOT_REQUIRED",
  PENDING = "PENDING",
  SYNCED = "SYNCED",
}

export enum PaymentResolutionStatus {
  NONE = "NONE",
  REFUND_REQUIRED = "REFUND_REQUIRED",
}
