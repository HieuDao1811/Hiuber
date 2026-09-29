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
