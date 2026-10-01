export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PAID";
export type PaymentMethod = "COD" | "MOCK_ONLINE" | null;

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface Order {
  id: string;
  customerUserId: string;
  restaurantId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  currency: string;
  version: number;
  deliveryAddress: string;
  receiverName: string;
  receiverPhone: string;
  totalPrice: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}
