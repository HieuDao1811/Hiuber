import type { Request, Response } from "express";
import {
  OrderIdSchema,
  SyncPaymentStatusSchema,
} from "../../model/order.dto.js";
import { dataResponse } from "../../shared/http-response.js";
import type { GetPaymentContextQueryHandler } from "../../usecase/get-payment-context.js";
import type { SyncPaymentStatusCommandHandler } from "../../usecase/sync-payment-status.js";

export class InternalOrderHttpService {
  constructor(
    private readonly getPaymentContext: GetPaymentContextQueryHandler,
    private readonly syncPaymentStatus: SyncPaymentStatusCommandHandler,
  ) {}

  async getContext(request: Request, response: Response) {
    const orderId = OrderIdSchema.parse(request.params.orderId);
    return response
      .status(200)
      .json(dataResponse(await this.getPaymentContext.query(orderId)));
  }

  async syncPayment(request: Request, response: Response) {
    const orderId = OrderIdSchema.parse(request.params.orderId);
    const input = SyncPaymentStatusSchema.parse(request.body);
    return response.status(200).json(
      dataResponse(
        await this.syncPaymentStatus.execute({ orderId, ...input }),
      ),
    );
  }
}
