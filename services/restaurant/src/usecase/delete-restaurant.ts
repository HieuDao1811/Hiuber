import {
  ICommandHandler,
  IRestaurantRepository,
} from "../interface/index.js";
import { Requester } from "../model/requester.js";
import { findOwnedRestaurantOrThrow } from "./restaurant-access.js";

export type DeleteRestaurantCommand = {
  id: string;
  requester: Requester;
};

export class DeleteRestaurantCommandHandler
  implements ICommandHandler<DeleteRestaurantCommand, void>
{
  constructor(private readonly repository: IRestaurantRepository) {}

  async execute(command: DeleteRestaurantCommand): Promise<void> {
    await findOwnedRestaurantOrThrow(
      this.repository,
      command.id,
      command.requester,
    );
    await this.repository.softDelete(command.id);
  }
}
