import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const playlistVideoSchema = new Schema(
  {
    playlistId: { type: Schema.Types.ObjectId, ref: "Playlist", required: true },
    videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    youtubePlaylistId: { type: String, required: true },
    youtubeVideoId: { type: String, required: true },
    position: { type: Number, required: true },
    episodeNumber: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    removedFromPlaylistAt: { type: Date, default: null },
    addedToPlaylistAt: { type: Date, default: null },
  },
  { timestamps: true }
);

playlistVideoSchema.index({ playlistId: 1, position: 1 });
playlistVideoSchema.index({ playlistId: 1, youtubeVideoId: 1 }, { unique: true });
playlistVideoSchema.index({ youtubeVideoId: 1 });

export type PlaylistVideoDocument = InferSchemaType<typeof playlistVideoSchema> & {
  _id: Types.ObjectId;
};

export const PlaylistVideo = model("PlaylistVideo", playlistVideoSchema);
