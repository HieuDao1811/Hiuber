import { ListResult } from "../../config/enum.js";
import { IUserRepository } from "../../interface/i-repository.js";
import { UpdateUserDTO, CondUserDTO, PagingDTO, CreateUserDTO } from "../../model/dto.js";
import { User } from "../../model/user.js";
import { UserModel } from "./mongodb/user.mongodb.js";

export class UserRepository implements IUserRepository {

  async insert(data: CreateUserDTO & { id: string }): Promise<string> {
    const { id, ...userData } = data;
    const result = await UserModel.create({ _id: id, ...userData });
    return result._id.toString();
  }

  async update(id: string, data: UpdateUserDTO): Promise<boolean> {
    const result = await UserModel.updateOne(
      { _id: id },
      { $set: data }
    )
    return result.matchedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async get(id: string): Promise<User | null> {
    const result = await UserModel.findById(id);
    if (!result) {
      return null;
    }

    const { _id, ...user } = result.toObject();

    return { id: _id.toString(), ...user };
  }

  async list(cond: CondUserDTO, paging: PagingDTO): Promise<ListResult<User>> {
    const { page, limit } = paging;

    const filter: Record<string, unknown> = {};
    if (cond.id) {
      filter._id = cond.id;
    }

    if (cond.name) {
      filter.name = { $regex: cond.name, $options: "i" };
    }

    const [users, total] = await Promise.all([
      UserModel.find(filter).skip((page-1) * limit).limit(limit),
      UserModel.countDocuments(filter)
    ])

    return {
      data: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        password: user.password,
        status: user.status,
        role: user.role,
        image: user.image,
      })),
      total
    };
  }

  async findByCond(cond: CondUserDTO): Promise<User | null> {
    const filter: Record<string, unknown> = {};

    if (cond.id) {
      filter._id = cond.id;
    }

    if (cond.name) {
      filter.name = cond.name;
    }

    if (cond.email) {
      filter.email = cond.email;
    }

    const result = await UserModel.findOne(filter);

    if (!result) {
      return null;
    }

    const { _id, ...user } = result.toObject();

    return {
      id: _id.toString(),
      ...user
    };
  }
}