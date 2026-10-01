import type { ICustomerService } from "../interface/customer-service.js";
import type { IOrderRepository } from "../interface/order-repository.js";
import type { IRestaurantService } from "../interface/restaurant-service.js";
import type { CreateOrderInput } from "../model/order.dto.js";
import type { Order } from "../model/order.js";
import { newOrderEvent } from "../model/order-event.js";
import {
  MenuItemNotFoundError,
  MenuItemRestaurantMismatchError,
  MenuItemUnavailableError,
  RestaurantClosedError,
} from "../model/errors.js";
import {
  OrderEventType,
  RestaurantStatus,
} from "../share/enums/index.js";
import {
  fromMinorUnits,
  normalizeMoney,
  toMinorUnits,
} from "../shared/money.js";

export interface CreateOrderCommand {
  customerUserId: string;
  accessToken: string;
  input: CreateOrderInput;
}

export class CreateOrderCommandHandler {
  private readonly deliveryFee: string;

  constructor(
    private readonly orders: IOrderRepository,
    private readonly customers: ICustomerService,
    private readonly restaurants: IRestaurantService,
    deliveryFee: string,
    private readonly currency = "VND",
  ) {
    this.deliveryFee = normalizeMoney(deliveryFee);
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error("currency must be a three-letter uppercase code");
    }
  }

  async execute(command: CreateOrderCommand): Promise<Order> {
    const { input } = command;
    const menuItemIds = input.items.map((item) => item.menuItemId);
    const [address, context] = await Promise.all([
      this.customers.getOwnedAddress(command.accessToken, input.addressId),
      this.restaurants.getOrderContext(input.restaurantId, menuItemIds),
    ]);

    if (context.restaurant.status !== RestaurantStatus.OPEN) {
      throw new RestaurantClosedError();
    }

    const menuItemsById = new Map(
      context.menuItems.map((item) => [item.id, item]),
    );
    let subtotalMinor = 0n;
    const items = input.items.map((requestedItem) => {
      const menuItem = menuItemsById.get(requestedItem.menuItemId);
      if (!menuItem) {
        throw new MenuItemNotFoundError(requestedItem.menuItemId);
      }
      if (menuItem.restaurantId !== input.restaurantId) {
        throw new MenuItemRestaurantMismatchError(requestedItem.menuItemId);
      }
      if (!menuItem.isAvailable) {
        throw new MenuItemUnavailableError(requestedItem.menuItemId);
      }

      const unitPriceMinor = toMinorUnits(menuItem.price);
      const lineTotalMinor = unitPriceMinor * BigInt(requestedItem.quantity);
      subtotalMinor += lineTotalMinor;

      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        unitPrice: fromMinorUnits(unitPriceMinor),
        quantity: requestedItem.quantity,
        lineTotal: fromMinorUnits(lineTotalMinor),
      };
    });

    const deliveryFeeMinor = toMinorUnits(this.deliveryFee);
    return this.orders.createAtomic(
      {
        customerUserId: command.customerUserId,
        restaurantId: input.restaurantId,
        currency: this.currency,
        addressLabel: address.label,
        deliveryAddress: address.address,
        receiverName: address.receiverName,
        receiverPhone: address.receiverPhone,
        subtotal: fromMinorUnits(subtotalMinor),
        deliveryFee: this.deliveryFee,
        totalPrice: fromMinorUnits(subtotalMinor + deliveryFeeMinor),
        items,
      },
      newOrderEvent(
        OrderEventType.ORDER_CREATED,
        context.restaurant.ownerUserId,
        [
          {
            recipientUserId: command.customerUserId,
            title: "Order placed",
            message: "Your order has been created and is awaiting confirmation.",
          },
          {
            recipientUserId: context.restaurant.ownerUserId,
            title: "New order",
            message: "A new order is waiting for your confirmation.",
          },
        ],
      ),
    );
  }
}
