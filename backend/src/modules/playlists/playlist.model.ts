import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const playlistSchema = new Schema(
  {
    youtubePlaylistId: { type: String, required: true, unique: true },
    source: { type: String, default: "youtube" },
    contentType: {
      type: String,
      enum: ["series", "movie"],
      default: "series",
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    customTitle: { type: String, default: "" },
    customChannelTitle: { type: String, default: "" },
    customYear: { type: String, default: "" },
    customSeriesLabel: { type: String, default: "" },
    customRating: { type: String, default: "" },
    customDescription: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    coverUrl: { type: String, default: "" },
    channelId: { type: String, default: "" },
    channelTitle: { type: String, default: "" },
    importedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    visibility: { type: String, default: "public" },
    videoCount: { type: Number, default: 0 },
    syncStatus: {
      type: String,
      enum: ["READY", "SYNCING", "FAILED"],
      default: "READY",
    },
    lastSyncedAt: { type: Date, default: null },
    lastImportJobId: { type: Schema.Types.ObjectId, ref: "ImportJob", default: null },
  },
  { timestamps: true }
);

playlistSchema.index({ importedByUserId: 1 });
playlistSchema.index({ channelId: 1 });
playlistSchema.index({ title: "text", description: "text" });

export type PlaylistDocument = InferSchemaType<typeof playlistSchema> & {
  _id: Types.ObjectId;
};

export const Playlist = model("Playlist", playlistSchema);
