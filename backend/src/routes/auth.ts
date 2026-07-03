import { Router, Request, Response, NextFunction } from "express";
import {
  emailExists,
  formatUser,
  getUserById,
  loginUser,
  registerUser,
} from "../modules/auth/auth.service.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../modules/auth/auth.middleware.js";

export const authRouter = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// POST /api/auth/register
authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body ?? {};
    try {
      const { user, token } = await registerUser({ email, password, name });
      res.status(201).json({ user: formatUser(user), token });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      res.status(400).json({ error: message });
    }
  })
);

// POST /api/auth/login
authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    try {
      const { user, token } = await loginUser({ email, password });
      res.json({ user: formatUser(user), token });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      res.status(401).json({ error: message });
    }
  })
);

// POST /api/auth/check-email — used by the Netflix-style "Continue" step
authRouter.post(
  "/check-email",
  asyncHandler(async (req, res) => {
    const { email } = req.body ?? {};
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    res.json({ exists: await emailExists(email) });
  })
);

// GET /api/auth/me
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await getUserById(req.user!.sub);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user: formatUser(user) });
  })
);
