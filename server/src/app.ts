import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { syncPhotoRouter } from "./routes/syncPhoto.js";
import { configureFrontendStatic } from "./services/frontendStatic.js";
import { configureStudentUploads } from "./services/studentUploads.js";
import { createContext } from "./trpc/context.js";
import { appRouter } from "./trpc/routers/index.js";

export const app = express();

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || false,
  })
);

configureStudentUploads(app);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.use("/api/sync", syncPhotoRouter);

configureFrontendStatic(app);
