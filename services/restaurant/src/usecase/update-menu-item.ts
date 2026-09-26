import {
  IMenuItemRepository,
  IRestaurantRepository,
  UploadImage,
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
  logo?: Buffer;
};

export class UpdateMenuItemCommandHandler {
  constructor(
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly menuItemRepository: IMenuItemRepository,
    private readonly uploadImage: UploadImage,
  ) {}

  async execute(command: UpdateMenuItemCommand): Promise<MenuItem> {
    const { restaurantId, itemId, input, requester, logo } = command;

    await findOwnedRestaurantOrThrow(
      this.restaurantRepository,
      restaurantId,
      requester,
    );

    const item = await this.menuItemRepository.findById(itemId);
    if (!item || item.restaurantId !== restaurantId) {
      throw new MenuItemNotFoundError();
    }

    const imageUrl = logo ? await this.uploadImage(logo) : input.imageUrl;

    const { price, ...otherFields } = input;
    const update: UpdateMenuItemData = {
      ...otherFields,
      ...(price === undefined ? {} : { price: price.toString() }),
      ...(imageUrl === undefined ? {} : { imageUrl }),
    };
    return this.menuItemRepository.update(itemId, update);
  }
}
