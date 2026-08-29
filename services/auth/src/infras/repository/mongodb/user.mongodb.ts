import mongoose, { Schema } from "mongoose";
import { Role, Status } from "../../../config/enum.js";

export const modelName = "User"

const UserPersistence = new Schema({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(Status),
    default: Status.ACTIVE
  },
  image: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: Object.values(Role),
    default: Role.CUSTOMER
  }
}, { timestamps: true }
);

export const UserModel = mongoose.model(modelName, UserPersistence);