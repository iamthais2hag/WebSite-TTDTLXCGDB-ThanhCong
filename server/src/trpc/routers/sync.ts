import { TRPCError } from "@trpc/server";
import { pushBatchInputSchema } from "shared";
import { upsertSyncBatch } from "../../services/syncBatchRepository.js";
import { normalizeSyncBatchRecords } from "../../services/syncBatchValidation.js";
import { router, syncProcedure } from "../trpc.js";

export const syncRouter = router({
  pushBatch: syncProcedure
    .input(pushBatchInputSchema)
    .mutation(async ({ input }) => {
      const normalizedRecords = normalizeSyncBatchRecords(input.records);

      try {
        const result = await upsertSyncBatch(normalizedRecords);

        return {
          success: true,
          processed: result.processed,
          validated: normalizedRecords.length,
          upserted: result.upserted,
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Khong the dong bo batch. Vui long thu lai.",
        });
      }
    }),
});
