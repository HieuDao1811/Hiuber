import {
  ICommandHandler,
  IRestaurantRepository,
} from "../interface/index.js";
import { UpdateRestaurantInput } from "../model/restaurant.dto.js";
import { Requester } from "../model/requester.js";
import { Restaurant } from "../model/restaurant.js";
import { findOwnedRestaurantOrThrow } from "./restaurant-access.js";

export type UpdateRestaurantCommand = {
  id: string;
  input: UpdateRestaurantInput;
  requester: Requester;
};

export class UpdateRestaurantCommandHandler
  implements ICommandHandler<UpdateRestaurantCommand, Restaurant>
{
  constructor(private readonly repository: IRestaurantRepository) {}

  async execute(command: UpdateRestaurantCommand): Promise<Restaurant> {
    await findOwnedRestaurantOrThrow(
      this.repository,
      command.id,
      command.requester,
    );

    return this.repository.update(command.id, command.input);
  }
}
