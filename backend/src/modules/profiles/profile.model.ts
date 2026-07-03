import { Schema, model, type InferSchemaType, type Types } from "mongoose";

export const PROFILE_COLORS = [
  "#e50914",
  "#f5a623",
  "#00b4d8",
  "#9e9e9e",
  "#6a0dad",
  "#2ecc71",
] as const;

export type ProfileColor = (typeof PROFILE_COLORS)[number];

const profileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 20 },
    color: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

profileSchema.index({ userId: 1 });

export type ProfileDocument = InferSchemaType<typeof profileSchema> & {
  _id: Types.ObjectId;
};

export const Profile = model("Profile", profileSchema);
