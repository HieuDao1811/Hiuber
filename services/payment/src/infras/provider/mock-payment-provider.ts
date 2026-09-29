import { randomUUID } from "node:crypto";
import type {
  IPaymentProvider,
  ProviderResult,
} from "../../interface/payment-provider.js";

export type MockOutcome = "SUCCESS" | "FAILURE";

export class MockPaymentProvider implements IPaymentProvider {
  constructor(private readonly outcome: MockOutcome) {}

  async charge(): Promise<ProviderResult> {
    if (this.outcome === "FAILURE") {
      return { succeeded: false, failureCode: "MOCK_PAYMENT_DECLINED" };
    }
    return {
      succeeded: true,
      providerTransactionId: `mock_${randomUUID()}`,
    };
  }
}
