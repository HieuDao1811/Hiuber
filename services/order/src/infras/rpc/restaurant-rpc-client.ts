import { z } from "zod";
import type {
  IRestaurantService,
  RestaurantOrderContext,
} from "../../interface/restaurant-service.js";
import {
  DependencyUnavailableError,
  RestaurantNotFoundError,
} from "../../model/errors.js";
import { RestaurantStatus } from "../../share/enums/index.js";

const PriceSchema = z
  .string()
  .regex(/^(0|[1-9]\d{0,9})(?:\.\d{1,2})?$/);

const RestaurantOrderContextSchema = z.object({
  restaurant: z.object({
    id: z.uuid(),
    ownerUserId: z.uuid(),
    status: z.enum(RestaurantStatus),
  }),
  menuItems: z.array(
    z.object({
      id: z.uuid(),
      restaurantId: z.uuid(),
      name: z.string().min(1),
      price: PriceSchema,
      isAvailable: z.boolean(),
    }),
  ),
});

export class RestaurantRpcClient implements IRestaurantService {
  private readonly orderContextUrl: URL;

  constructor(
    restaurantServiceUrl: string,
    private readonly internalServiceKey: string,
    private readonly requestTimeoutMs = 5_000,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.orderContextUrl = new URL(
      "/internal/restaurants/order-context",
      restaurantServiceUrl,
    );
  }

  async getOrderContext(
    restaurantId: string,
    menuItemIds: string[],
  ): Promise<RestaurantOrderContext> {
    let response: Response;

    try {
      response = await this.fetcher(this.orderContextUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-service-key": this.internalServiceKey,
        },
        body: JSON.stringify({ restaurantId, menuItemIds }),
        signal: AbortSignal.timeout(this.requestTimeoutMs),
      });
    } catch {
      throw new DependencyUnavailableError("RESTAURANT");
    }

    if (response.status === 404) {
      throw new RestaurantNotFoundError();
    }
    if (!response.ok) {
      throw new DependencyUnavailableError("RESTAURANT");
    }

    try {
      const context = RestaurantOrderContextSchema.parse(await response.json());
      if (context.restaurant.id !== restaurantId) {
        throw new Error("Restaurant response id mismatch");
      }
      return context;
    } catch {
      throw new DependencyUnavailableError("RESTAURANT");
    }
  }
}
