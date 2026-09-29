import type {
  OrderPaymentStatus,
  OrderStatus,
  PaymentMethod,
} from "../share/enums/index.js";

export interface PaymentOrderContext {
  id: string;
  customerUserId: string;
  status: OrderStatus;
  totalPrice: string;
  paymentMethod: PaymentMethod | null;
  paymentStatus: OrderPaymentStatus;
}

export interface IOrderService {
  getPaymentContext(orderId: string): Promise<PaymentOrderContext>;
  syncPayment(
    orderId: string,
    method: PaymentMethod,
    status: OrderPaymentStatus,
  ): Promise<void>;
}
