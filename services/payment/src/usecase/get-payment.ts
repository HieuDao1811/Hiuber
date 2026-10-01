import type { IPaymentRepository } from "../interface/payment-repository.js";
import { PaymentNotFoundError } from "../model/errors.js";
import { toPublicPayment } from "../model/payment.js";

export class GetPaymentQueryHandler {
  constructor(private readonly payments: IPaymentRepository) {}

  async query(id: string, customerId: string) {
    const payment = await this.payments.findByIdForCustomer(id, customerId);
    if (!payment) throw new PaymentNotFoundError();
    return toPublicPayment(payment);
  }
}
