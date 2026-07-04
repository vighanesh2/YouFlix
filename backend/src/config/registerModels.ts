/**
 * Side-effect imports so Mongoose registers all models before populate() runs.
 * Required for serverless bundles that tree-shake type-only imports.
 */
import "../modules/videos/video.model.js";
import "../modules/playlists/playlist.model.js";
import "../modules/playlist-videos/playlistVideo.model.js";
import "../modules/import-jobs/importJob.model.js";
import "../modules/users/user.model.js";
import "../modules/profiles/profile.model.js";
