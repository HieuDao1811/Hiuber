export enum UserRole {
  CUSTOMER = "CUSTOMER",
  RESTAURANT = "RESTAURANT",
  RIDER = "RIDER",
}

export enum RestaurantStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PREPARING = "PREPARING",
  READY = "READY",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PaymentMethod {
  COD = "COD",
  MOCK_ONLINE = "MOCK_ONLINE",
}

export enum PaymentStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
}

export enum OrderEventType {
  ORDER_CREATED = "ORDER_CREATED",
  ORDER_STATUS_UPDATED = "ORDER_STATUS_UPDATED",
  PAYMENT_STATUS_UPDATED = "PAYMENT_STATUS_UPDATED",
}
