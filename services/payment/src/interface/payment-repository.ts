import type { Payment } from "../model/payment.js";
import type {
  PaymentMethod,
  PaymentStatus,
} from "../share/enums/index.js";

export interface ClaimPaymentData {
  orderId: string;
  customerId: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  idempotencyKey: string;
  requestHash: string;
}

export type ClaimPaymentResult =
  | { kind: "CLAIMED"; payment: Payment }
  | { kind: "EXISTING"; payment: Payment }
  | { kind: "ORDER_CONFLICT" };

export interface IPaymentRepository {
  findByIdempotencyKey(
    customerId: string,
    idempotencyKey: string,
  ): Promise<Payment | null>;
  claim(data: ClaimPaymentData): Promise<ClaimPaymentResult>;
  findByIdForCustomer(id: string, customerId: string): Promise<Payment | null>;
  markSucceeded(id: string, providerTransactionId: string): Promise<Payment>;
  markFailed(id: string, failureCode: string): Promise<Payment>;
  markOrderSynced(id: string): Promise<Payment>;
  recordOrderSyncFailure(id: string, nextAttemptAt: Date): Promise<Payment>;
  findDueOrderSync(now: Date, limit: number): Promise<Payment[]>;
}
