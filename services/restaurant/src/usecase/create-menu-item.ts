import {
  ICommandHandler,
  IMenuItemRepository,
  IRestaurantRepository,
} from "../interface/index.js";
import { CreateMenuItemInput } from "../model/restaurant.dto.js";
import { Requester } from "../model/requester.js";
import { MenuItem } from "../model/restaurant.js";
import { findOwnedRestaurantOrThrow } from "./restaurant-access.js";

export type CreateMenuItemCommand = {
  restaurantId: string;
  input: CreateMenuItemInput;
  requester: Requester;
};

export class CreateMenuItemCommandHandler
  implements ICommandHandler<CreateMenuItemCommand, MenuItem>
{
  constructor(
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly menuItemRepository: IMenuItemRepository,
  ) {}

  async execute(command: CreateMenuItemCommand): Promise<MenuItem> {
    await findOwnedRestaurantOrThrow(
      this.restaurantRepository,
      command.restaurantId,
      command.requester,
    );

    return this.menuItemRepository.create({
      restaurantId: command.restaurantId,
      name: command.input.name,
      price: command.input.price.toString(),
      imageUrl: command.input.imageUrl,
    });
  }
}
