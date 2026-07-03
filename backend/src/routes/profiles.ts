import { Router } from "express";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../modules/auth/auth.middleware.js";
import {
  createProfile,
  listProfiles,
} from "../modules/profiles/profile.service.js";

export const profilesRouter = Router();

function asyncHandler(
  fn: (req: AuthenticatedRequest, res: import("express").Response) => Promise<void>
) {
  return (req: AuthenticatedRequest, res: import("express").Response, next: import("express").NextFunction) => {
    fn(req, res).catch(next);
  };
}

profilesRouter.use(requireAuth);

// GET /api/profiles
profilesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const profiles = await listProfiles(req.user!.sub);
    res.json({ profiles });
  })
);

// POST /api/profiles
profilesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const profile = await createProfile(req.user!.sub, {
        name: req.body?.name ?? "",
        color: req.body?.color,
      });
      res.status(201).json({ profile });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create profile";
      res.status(400).json({ error: message });
    }
  })
);
