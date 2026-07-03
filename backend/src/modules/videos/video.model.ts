import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const videoSchema = new Schema(
  {
    youtubeVideoId: { type: String, required: true, unique: true },
    source: { type: String, default: "youtube" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    channelId: { type: String, default: "" },
    channelTitle: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    durationIso: { type: String, default: "" },
    durationSeconds: { type: Number, default: 0 },
    publishedAt: { type: Date, default: null },
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    embeddable: { type: Boolean, default: true },
    privacyStatus: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "public",
    },
    availabilityStatus: {
      type: String,
      enum: ["available", "private", "deleted", "unavailable"],
      default: "available",
    },
  },
  { timestamps: true }
);

videoSchema.index({ channelId: 1 });
videoSchema.index({ title: "text", description: "text" });

export type VideoDocument = InferSchemaType<typeof videoSchema> & {
  _id: Types.ObjectId;
};

export const Video = model("Video", videoSchema);
