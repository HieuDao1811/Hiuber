import { IRestaurantRepository } from "../interface/index.js";
import { CreateRestaurantInput } from "../model/restaurant.dto.js";
import { Requester } from "../model/requester.js";
import { Restaurant } from "../model/restaurant.js";

export type CreateRestaurantCommand = {
  input: CreateRestaurantInput;
  requester: Requester;
};

export class CreateRestaurantCommandHandler {
  constructor(private readonly repository: IRestaurantRepository) {}

  execute(command: CreateRestaurantCommand): Promise<Restaurant> {
    const { input, requester } = command;

    return this.repository.create({
      ownerUserId: requester.sub,
      name: input.name,
      address: input.address,
    });
  }
}
