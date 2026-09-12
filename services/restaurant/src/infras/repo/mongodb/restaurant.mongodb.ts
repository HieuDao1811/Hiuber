import mongoose, { Schema } from "mongoose";

export const modelName = "Restaurant"

const RestaurantPersistence = new Schema({
    _id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
    },
    image: {
      type: String,
      required: true
    },
    ownerId: {
      type: String,
      required: true
    },
    phone: {
      type: Number,
      required: true
    },
    isVerified: {
      type: Boolean,
      required: true
    },
    autoLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: true
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      formattedAddress: {
        type: String
      }
    },
    isOpen: {
      type: Boolean,
      default: false
    }

  },
  { timestamps: true }
);

export const UserModel = mongoose.model(modelName, RestaurantPersistence);