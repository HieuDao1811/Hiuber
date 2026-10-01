import type { IPaymentProvider } from "../interface/payment-provider.js";
import type { IPaymentRepository } from "../interface/payment-repository.js";
import { PaymentStatus } from "../share/enums/index.js";
import { normalizeMoney } from "../shared/money.js";
import type { OrderPaymentSynchronizer } from "./order-payment-synchronizer.js";

export class ProcessProviderWebhookCommandHandler {
  constructor(
    private readonly payments: IPaymentRepository,
    private readonly provider: IPaymentProvider,
    private readonly synchronizer: OrderPaymentSynchronizer,
  ) {}

  async execute(rawBody: Buffer, signature: string | undefined) {
    const event = this.provider.verifyWebhook(rawBody, signature);
    const result = await this.payments.applyProviderEvent({
      ...event,
      amount: normalizeMoney(event.amount),
      status:
        event.status === "SUCCEEDED"
          ? PaymentStatus.SUCCEEDED
          : PaymentStatus.FAILED,
    });
    const payment = await this.synchronizer.attempt(result.payment);
    return { payment, duplicate: result.duplicate };
  }
}
