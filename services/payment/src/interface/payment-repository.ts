import type { Payment } from "../model/payment.js";
import type {
  PaymentMethod,
  PaymentStatus,
} from "../share/enums/index.js";

export interface ClaimPaymentData {
  orderId: string;
  customerId: string;
  amount: string;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  idempotencyKey: string;
  requestHash: string;
}

export type ClaimPaymentResult =
  | { kind: "CLAIMED"; payment: Payment }
  | { kind: "EXISTING"; payment: Payment }
  | { kind: "ORDER_CONFLICT" };

export interface ProviderEventData {
  provider: string;
  providerEventId: string;
  paymentId: string;
  orderId: string;
  providerTransactionId: string;
  amount: string;
  currency: string;
  status: PaymentStatus.SUCCEEDED | PaymentStatus.FAILED;
  failureCode: string | null;
}

export interface ApplyProviderEventResult {
  payment: Payment;
  duplicate: boolean;
}

export interface IPaymentRepository {
  findByIdempotencyKey(
    customerId: string,
    idempotencyKey: string,
  ): Promise<Payment | null>;
  claim(data: ClaimPaymentData): Promise<ClaimPaymentResult>;
  findByIdForCustomer(id: string, customerId: string): Promise<Payment | null>;
  markProcessing(id: string, providerTransactionId: string): Promise<Payment>;
  markSucceeded(id: string, providerTransactionId: string): Promise<Payment>;
  markFailed(
    id: string,
    providerTransactionId: string,
    failureCode: string,
  ): Promise<Payment>;
  applyProviderEvent(
    event: ProviderEventData,
  ): Promise<ApplyProviderEventResult>;
  markOrderSynced(id: string, refundRequired?: boolean): Promise<Payment>;
  recordOrderSyncFailure(id: string, nextAttemptAt: Date): Promise<Payment>;
  findDueOrderSync(now: Date, limit: number): Promise<Payment[]>;
}
