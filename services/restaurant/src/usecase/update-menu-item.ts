import {
  ICommandHandler,
  IMenuItemRepository,
  IRestaurantRepository,
  UpdateMenuItemData,
} from "../interface/index.js";
import { MenuItemNotFoundError } from "../model/errors.js";
import { UpdateMenuItemInput } from "../model/restaurant.dto.js";
import { Requester } from "../model/requester.js";
import { MenuItem } from "../model/restaurant.js";
import { findOwnedRestaurantOrThrow } from "./restaurant-access.js";

export type UpdateMenuItemCommand = {
  restaurantId: string;
  itemId: string;
  input: UpdateMenuItemInput;
  requester: Requester;
};

export class UpdateMenuItemCommandHandler
  implements ICommandHandler<UpdateMenuItemCommand, MenuItem>
{
  constructor(
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly menuItemRepository: IMenuItemRepository,
  ) {}

  async execute(command: UpdateMenuItemCommand): Promise<MenuItem> {
    await findOwnedRestaurantOrThrow(
      this.restaurantRepository,
      command.restaurantId,
      command.requester,
    );

    const item = await this.menuItemRepository.findById(command.itemId);
    if (!item || item.restaurantId !== command.restaurantId) {
      throw new MenuItemNotFoundError();
    }

    const { price, ...otherFields } = command.input;
    const update: UpdateMenuItemData = {
      ...otherFields,
      ...(price === undefined ? {} : { price: price.toString() }),
    };
    return this.menuItemRepository.update(command.itemId, update);
  }
}
