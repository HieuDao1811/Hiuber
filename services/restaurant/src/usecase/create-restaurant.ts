import { randomUUID } from "node:crypto";
import {
  ICommandHandler,
  IRestaurantRepository,
} from "../interface/index.js";
import { RestaurantAlreadyExistsError } from "../model/errors.js";
import { CreateRestaurantInput } from "../model/restaurant.dto.js";
import { Requester } from "../model/requester.js";
import { Restaurant } from "../model/restaurant.js";
import { RestaurantStatus } from "../share/enums/index.js";

export type CreateRestaurantCommand = {
  input: CreateRestaurantInput;
  requester: Requester;
};

export class CreateRestaurantCommandHandler
  implements ICommandHandler<CreateRestaurantCommand, Restaurant>
{
  constructor(private readonly repository: IRestaurantRepository) {}

  async execute(command: CreateRestaurantCommand): Promise<Restaurant> {
    const existingRestaurant = await this.repository.findByOwnerId(
      command.requester.sub,
    );

    if (
      existingRestaurant &&
      existingRestaurant.status !== RestaurantStatus.DELETED &&
      existingRestaurant.deletedAt === null
    ) {
      throw new RestaurantAlreadyExistsError();
    }

    const now = new Date();
    return this.repository.create({
      id: randomUUID(),
      ownerId: command.requester.sub,
      name: command.input.name,
      description: command.input.description ?? null,
      phone: command.input.phone,
      address: command.input.address,
      latitude: command.input.latitude ?? null,
      longitude: command.input.longitude ?? null,
      status: RestaurantStatus.PENDING,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }
}
