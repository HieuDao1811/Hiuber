import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../share/enums/index.js";

export interface OrderItem {
  id: string;
  orderId: string;
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
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  addressLabel: string | null;
  deliveryAddress: string;
  receiverName: string;
  receiverPhone: string;
  subtotal: string;
  deliveryFee: string;
  totalPrice: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}
