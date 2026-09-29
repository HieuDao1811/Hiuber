import type { Request, Response } from "express";
import {
  CreatePaymentSchema,
  IdempotencyKeySchema,
  PaymentIdSchema,
} from "../../model/payment.dto.js";
import { UnauthenticatedError } from "../../model/errors.js";
import { RequesterSchema } from "../../model/requester.js";
import { dataResponse } from "../../shared/http-response.js";
import type { CreatePaymentCommandHandler } from "../../usecase/create-payment.js";
import type { GetPaymentQueryHandler } from "../../usecase/get-payment.js";

export class PaymentHttpService {
  constructor(
    private readonly createPayment: CreatePaymentCommandHandler,
    private readonly getPayment: GetPaymentQueryHandler,
  ) {}

  private customerId(response: Response): string {
    const requester = RequesterSchema.safeParse(response.locals.requester);
    if (!requester.success) throw new UnauthenticatedError();
    return requester.data.userId;
  }

  async create(request: Request, response: Response) {
    const input = CreatePaymentSchema.parse(request.body);
    const idempotencyKey = IdempotencyKeySchema.parse(
      request.header("idempotency-key"),
    );
    const result = await this.createPayment.execute({
      customerId: this.customerId(response),
      idempotencyKey,
      input,
    });
    const status = result.inFlight ? 202 : result.replayed ? 200 : 201;
    return response.status(status).json(dataResponse(result.payment));
  }

  async get(request: Request, response: Response) {
    const id = PaymentIdSchema.parse(request.params.id);
    const payment = await this.getPayment.query(id, this.customerId(response));
    return response.status(200).json(dataResponse(payment));
  }
}
