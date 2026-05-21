import { Router } from "express";

export const syncPhotoRouter = Router();

syncPhotoRouter.post("/student-photo", (_req, res) => {
  res.status(501).json({
    success: false,
    error: "Photo upload multipart route is reserved for later implementation.",
  });
});
