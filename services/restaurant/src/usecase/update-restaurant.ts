import { IRestaurantRepository } from "../interface/index.js";
import { UpdateRestaurantInput } from "../model/restaurant.dto.js";
import { Requester } from "../model/requester.js";
import { Restaurant } from "../model/restaurant.js";
import { findOwnedRestaurantOrThrow } from "./restaurant-access.js";

export type UpdateRestaurantCommand = {
  id: string;
  input: UpdateRestaurantInput;
  requester: Requester;
};

export class UpdateRestaurantCommandHandler {
  constructor(private readonly repository: IRestaurantRepository) {}

  async execute(command: UpdateRestaurantCommand): Promise<Restaurant> {
    const { id, input, requester } = command;

    await findOwnedRestaurantOrThrow(this.repository, id, requester);
    return this.repository.update(id, input);
  }
}
