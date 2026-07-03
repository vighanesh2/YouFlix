import { Router, Request, Response, NextFunction } from "express";
import {
  formatImportJob,
  getImportJobById,
} from "../modules/import-jobs/importJob.service.js";

export const importJobsRouter = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// GET /api/import-jobs/:jobId
importJobsRouter.get(
  "/:jobId",
  asyncHandler(async (req, res) => {
    const job = await getImportJobById(String(req.params.jobId));
    if (!job) {
      res.status(404).json({ error: "Import job not found" });
      return;
    }
    res.json(formatImportJob(job));
  })
);
