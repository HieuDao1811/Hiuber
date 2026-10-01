import { z } from "zod";
import type {
  IOrderService,
  PaymentOrderContext,
} from "../../interface/order-service.js";
import {
  DependencyUnavailableError,
  OrderNotFoundError,
} from "../../model/errors.js";
import {
  OrderPaymentStatus,
  OrderStatus,
  PaymentMethod,
} from "../../share/enums/index.js";

const MoneySchema = z.string().regex(/^(0|[1-9]\d{0,15})(?:\.\d{1,2})?$/);
const ContextResponseSchema = z.object({
  data: z
    .object({
      id: z.uuid(),
      customerUserId: z.uuid(),
      status: z.enum(OrderStatus),
      totalPrice: MoneySchema,
      currency: z.string().regex(/^[A-Z]{3}$/),
      paymentMethod: z.enum(PaymentMethod).nullable(),
      paymentStatus: z.enum(OrderPaymentStatus),
    })
    .strict(),
});
const SyncResponseSchema = z.object({
  data: z.object({ status: z.enum(OrderStatus) }),
});

export class OrderRpcClient implements IOrderService {
  private readonly baseUrl: URL;

  constructor(
    orderServiceUrl: string,
    private readonly internalServiceKey: string,
    private readonly requestTimeoutMs = 5_000,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.baseUrl = new URL(orderServiceUrl);
  }

  private headers(): Record<string, string> {
    return {
      "content-type": "application/json",
      "x-internal-service-key": this.internalServiceKey,
    };
  }

  async getPaymentContext(orderId: string): Promise<PaymentOrderContext> {
    const url = new URL(
      `/internal/orders/${encodeURIComponent(orderId)}/payment-context`,
      this.baseUrl,
    );
    let response: Response;
    try {
      response = await this.fetcher(url, {
        headers: this.headers(),
        signal: AbortSignal.timeout(this.requestTimeoutMs),
      });
    } catch {
      throw new DependencyUnavailableError("ORDER");
    }
    if (response.status === 404) throw new OrderNotFoundError();
    if (!response.ok) throw new DependencyUnavailableError("ORDER");

    try {
      const context = ContextResponseSchema.parse(await response.json()).data;
      if (context.id !== orderId) throw new Error("Order id mismatch");
      return context;
    } catch {
      throw new DependencyUnavailableError("ORDER");
    }
  }

  async syncPayment(
    orderId: string,
    method: PaymentMethod,
    status: OrderPaymentStatus,
  ): Promise<{ orderStatus: OrderStatus }> {
    const url = new URL(
      `/internal/orders/${encodeURIComponent(orderId)}/payment`,
      this.baseUrl,
    );
    let response: Response;
    try {
      response = await this.fetcher(url, {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify({ method, status }),
        signal: AbortSignal.timeout(this.requestTimeoutMs),
      });
    } catch {
      throw new DependencyUnavailableError("ORDER");
    }
    if (!response.ok) throw new DependencyUnavailableError("ORDER");
    try {
      const result = SyncResponseSchema.parse(await response.json());
      return { orderStatus: result.data.status };
    } catch {
      throw new DependencyUnavailableError("ORDER");
    }
  }
}
