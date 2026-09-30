export type ProviderResult =
  | { status: "PENDING"; providerTransactionId: string }
  | { status: "SUCCEEDED"; providerTransactionId: string }
  | {
      status: "FAILED";
      providerTransactionId: string;
      failureCode: string;
    };

export interface VerifiedProviderEvent {
  provider: string;
  providerEventId: string;
  paymentId: string;
  orderId: string;
  providerTransactionId: string;
  amount: string;
  currency: string;
  status: "SUCCEEDED" | "FAILED";
  failureCode: string | null;
}

export interface IPaymentProvider {
  charge(input: {
    paymentId: string;
    orderId: string;
    amount: string;
    currency: string;
  }): Promise<ProviderResult>;
  verifyWebhook(
    rawBody: Buffer,
    signature: string | undefined,
  ): VerifiedProviderEvent;
}
