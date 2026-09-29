export type ProviderResult =
  | { succeeded: true; providerTransactionId: string }
  | { succeeded: false; failureCode: string };

export interface IPaymentProvider {
  charge(input: {
    paymentId: string;
    orderId: string;
    amount: string;
  }): Promise<ProviderResult>;
}
