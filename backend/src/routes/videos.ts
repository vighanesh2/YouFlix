import { Router, Request, Response, NextFunction } from "express";
import {
  getCategories,
  getTrendingVideos,
  getVideoById,
  getVideosByCategory,
  searchVideos,
} from "../services/youtube.js";

export const videosRouter = Router();

function queryString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function parseIntParam(value: unknown, defaultValue: number): number {
  const parsed = parseInt(queryString(value) ?? "", 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// GET /api/videos/trending — must be before /:videoId
videosRouter.get(
  "/trending",
  asyncHandler(async (req, res) => {
    const result = await getTrendingVideos({
      regionCode: queryString(req.query.regionCode),
      categoryId: queryString(req.query.categoryId),
      maxResults: parseIntParam(req.query.maxResults, 20),
      pageToken: queryString(req.query.pageToken),
    });
    res.json(result);
  })
);

// GET /api/videos/categories — browse rows for Netflix-style UI
videosRouter.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const categories = await getCategories(
      queryString(req.query.regionCode) ?? "US"
    );
    res.json({ categories });
  })
);

// GET /api/videos/category/:categoryId
videosRouter.get(
  "/category/:categoryId",
  asyncHandler(async (req, res) => {
    const result = await getVideosByCategory(String(req.params.categoryId), {
      regionCode: queryString(req.query.regionCode),
      maxResults: parseIntParam(req.query.maxResults, 20),
      pageToken: queryString(req.query.pageToken),
    });
    res.json(result);
  })
);

// GET /api/videos?q=search&maxResults=20&pageToken=...
videosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const order = queryString(req.query.order);
    const validOrders = [
      "date",
      "rating",
      "relevance",
      "title",
      "videoCount",
      "viewCount",
    ] as const;

    const result = await searchVideos({
      q: queryString(req.query.q),
      categoryId: queryString(req.query.categoryId),
      channelId: queryString(req.query.channelId),
      regionCode: queryString(req.query.regionCode),
      maxResults: parseIntParam(req.query.maxResults, 20),
      pageToken: queryString(req.query.pageToken),
      order: validOrders.includes(order as (typeof validOrders)[number])
        ? (order as (typeof validOrders)[number])
        : undefined,
    });
    res.json(result);
  })
);

// GET /api/videos/:videoId
videosRouter.get(
  "/:videoId",
  asyncHandler(async (req, res) => {
    const video = await getVideoById(String(req.params.videoId));
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }
    res.json({ video });
  })
);
