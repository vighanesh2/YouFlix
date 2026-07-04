import { Router, Request, Response, NextFunction } from "express";
import { coverUpload } from "../config/uploads.js";
import {
  startPlaylistImport,
  startPlaylistSync,
} from "../modules/import-jobs/importJob.service.js";
import { saveCoverAsAvif } from "../services/imageProcessor.js";
import { parseShowOverrides, parseShowOverridesForUpdate } from "../utils/showOverrides.js";
import {
  deletePlaylist,
  formatPlaylist,
  getPlaylistById,
  getPlaylistVideos,
  listPlaylists,
  updatePlaylistById,
} from "../modules/playlists/playlist.service.js";

export const playlistsRouter = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// POST /api/playlists/import
playlistsRouter.post(
  "/import",
  coverUpload.single("cover"),
  asyncHandler(async (req, res) => {
    const url = req.body?.url;
    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "Missing or invalid playlist URL" });
      return;
    }

    const coverUrl = req.file
      ? await saveCoverAsAvif(req.file.buffer, "hero")
      : undefined;

    const showOverrides = parseShowOverrides(req.body ?? {});

    try {
      const result = await startPlaylistImport(url, {
        coverUrl,
        ...showOverrides,
      });

      if (result.type === "ALREADY_IMPORTED") {
        res.json({
          playlistId: result.playlistId,
          status: result.status,
          message: result.message,
        });
        return;
      }

      res.status(202).json({
        jobId: result.jobId,
        status: result.status,
        message: result.message,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid playlist URL";
      res.status(400).json({ error: message });
    }
  })
);

// GET /api/playlists
playlistsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const playlists = await listPlaylists();
    res.json({ playlists });
  })
);

// PATCH /api/playlists/:playlistId
playlistsRouter.patch(
  "/:playlistId",
  coverUpload.single("cover"),
  asyncHandler(async (req, res) => {
    const playlistId = String(req.params.playlistId);
    const playlist = await getPlaylistById(playlistId);
    if (!playlist) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }

    const overrides = parseShowOverridesForUpdate(req.body ?? {});

    let coverUrl: string | null | undefined;
    if (req.file) {
      coverUrl = await saveCoverAsAvif(req.file.buffer, "hero");
    } else if (req.body?.removeCover === "true") {
      coverUrl = null;
    }

    const updated = await updatePlaylistById(playlistId, {
      overrides,
      ...(coverUrl !== undefined ? { coverUrl } : {}),
    });

    if (!updated) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }

    res.json(await formatPlaylist(updated));
  })
);

// GET /api/playlists/:playlistId
playlistsRouter.get(
  "/:playlistId",
  asyncHandler(async (req, res) => {
    const playlist = await getPlaylistById(String(req.params.playlistId));
    if (!playlist) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }
    res.json(await formatPlaylist(playlist));
  })
);

// GET /api/playlists/:playlistId/videos
playlistsRouter.get(
  "/:playlistId/videos",
  asyncHandler(async (req, res) => {
    const videos = await getPlaylistVideos(String(req.params.playlistId));
    if (!videos) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }
    res.json(videos);
  })
);

// POST /api/playlists/:playlistId/sync
playlistsRouter.post(
  "/:playlistId/sync",
  asyncHandler(async (req, res) => {
    try {
      const result = await startPlaylistSync(String(req.params.playlistId));
      res.status(202).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed";
      const status = message.includes("not found") ? 404 : 400;
      res.status(status).json({ error: message });
    }
  })
);

// DELETE /api/playlists/:playlistId
playlistsRouter.delete(
  "/:playlistId",
  asyncHandler(async (req, res) => {
    const deleted = await deletePlaylist(String(req.params.playlistId));
    if (!deleted) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }
    res.json({ message: "Playlist deleted" });
  })
);
