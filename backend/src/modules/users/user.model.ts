import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: Types.ObjectId;
};

export const User = model("User", userSchema);
