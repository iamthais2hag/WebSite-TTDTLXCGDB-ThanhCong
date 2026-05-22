import { pushBatchInputSchema } from "shared";
import { normalizeSyncBatchRecords } from "../../services/syncBatchValidation.js";
import { router, syncProcedure } from "../trpc.js";

export const syncRouter = router({
  pushBatch: syncProcedure
    .input(pushBatchInputSchema)
    .mutation(({ input }) => {
      const normalizedRecords = normalizeSyncBatchRecords(input.records);

      return {
        success: true,
        processed: normalizedRecords.length,
        validated: normalizedRecords.length,
        records: normalizedRecords.map((record) => ({
          MaDK: record.MaDK,
          LoaiDaoTao: record.LoaiDaoTao,
        })),
      };
    }),
});
