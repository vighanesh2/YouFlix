import type { NextFunction, Request, Response } from "express";
import { verifyToken, type AuthTokenPayload } from "./auth.service.js";

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
