import {
  IMenuItemRepository,
  IRestaurantRepository,
  UploadImage,
} from "../interface/index.js";
import { CreateMenuItemInput } from "../model/restaurant.dto.js";
import { Requester } from "../model/requester.js";
import { MenuItem } from "../model/restaurant.js";
import { findOwnedRestaurantOrThrow } from "./restaurant-access.js";

export type CreateMenuItemCommand = {
  restaurantId: string;
  input: CreateMenuItemInput;
  requester: Requester;
  logo?: Buffer;
};

export class CreateMenuItemCommandHandler {
  constructor(
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly menuItemRepository: IMenuItemRepository,
    private readonly uploadImage: UploadImage,
  ) {}

  async execute(command: CreateMenuItemCommand): Promise<MenuItem> {
    const { restaurantId, input, requester, logo } = command;

    await findOwnedRestaurantOrThrow(
      this.restaurantRepository,
      restaurantId,
      requester,
    );

    const imageUrl = logo ? await this.uploadImage(logo) : input.imageUrl;

    return this.menuItemRepository.create({
      restaurantId,
      name: input.name,
      price: input.price.toString(),
      imageUrl,
    });
  }
}
