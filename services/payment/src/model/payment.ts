import type {
  OrderSyncStatus,
  PaymentMethod,
  PaymentStatus,
} from "../share/enums/index.js";

export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  providerTransactionId: string | null;
  failureCode: string | null;
  idempotencyKey: string;
  requestHash: string;
  orderSyncStatus: OrderSyncStatus;
  orderSyncAttempts: number;
  nextOrderSyncAt: Date | null;
  orderSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicPayment = Omit<Payment, "idempotencyKey" | "requestHash">;

export const toPublicPayment = ({
  idempotencyKey: _idempotencyKey,
  requestHash: _requestHash,
  ...payment
}: Payment): PublicPayment => payment;
