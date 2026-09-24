import {
  ICommandHandler,
  IRestaurantRepository,
} from "../interface/index.js";
import { CreateRestaurantInput } from "../model/restaurant.dto.js";
import { Requester } from "../model/requester.js";
import { Restaurant } from "../model/restaurant.js";

export type CreateRestaurantCommand = {
  input: CreateRestaurantInput;
  requester: Requester;
};

export class CreateRestaurantCommandHandler
  implements ICommandHandler<CreateRestaurantCommand, Restaurant>
{
  constructor(private readonly repository: IRestaurantRepository) {}

  execute(command: CreateRestaurantCommand): Promise<Restaurant> {
    return this.repository.create({
      ownerUserId: command.requester.sub,
      name: command.input.name,
      address: command.input.address,
    });
  }
}
