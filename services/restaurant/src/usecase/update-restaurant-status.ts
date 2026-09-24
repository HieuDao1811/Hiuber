import {
  ICommandHandler,
  IRestaurantRepository,
} from "../interface/index.js";
import { InvalidRestaurantStatusError } from "../model/errors.js";
import { Requester } from "../model/requester.js";
import { Restaurant } from "../model/restaurant.js";
import { RestaurantStatus } from "../share/enums/index.js";
import { findOwnedRestaurantOrThrow } from "./restaurant-access.js";

export type UpdateRestaurantStatusCommand = {
  id: string;
  status: RestaurantStatus;
  requester: Requester;
};

export class UpdateRestaurantStatusCommandHandler
  implements ICommandHandler<UpdateRestaurantStatusCommand, Restaurant>
{
  constructor(private readonly repository: IRestaurantRepository) {}

  async execute(
    command: UpdateRestaurantStatusCommand,
  ): Promise<Restaurant> {
    if (command.status === RestaurantStatus.DELETED) {
      throw new InvalidRestaurantStatusError();
    }

    await findOwnedRestaurantOrThrow(
      this.repository,
      command.id,
      command.requester,
    );

    return this.repository.updateStatus(command.id, command.status);
  }
}
