import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const importJobSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    playlistUrl: { type: String, required: true },
    youtubePlaylistId: { type: String, required: true },
    playlistId: { type: Schema.Types.ObjectId, ref: "Playlist", default: null },
    status: {
      type: String,
      enum: ["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "PARTIAL_FAILED"],
      default: "QUEUED",
    },
    totalVideosFound: { type: Number, default: 0 },
    totalVideosImported: { type: Number, default: 0 },
    totalVideosFailed: { type: Number, default: 0 },
    errorMessage: { type: String, default: null },
    errorCode: { type: String, default: null },
    coverUrl: { type: String, default: null },
    customTitle: { type: String, default: null },
    customChannelTitle: { type: String, default: null },
    customYear: { type: String, default: null },
    customSeriesLabel: { type: String, default: null },
    customRating: { type: String, default: null },
    customDescription: { type: String, default: null },
    retryCount: { type: Number, default: 0 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

importJobSchema.index({ userId: 1, createdAt: -1 });
importJobSchema.index({ status: 1 });
importJobSchema.index({ youtubePlaylistId: 1 });

export type ImportJobDocument = InferSchemaType<typeof importJobSchema> & {
  _id: Types.ObjectId;
};

export const ImportJob = model("ImportJob", importJobSchema);
