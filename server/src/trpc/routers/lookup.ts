import { lookupSearchInputSchema, studentLookupPublicSchema } from "shared";
import { searchStudentLookupRecords } from "../../services/studentLookupRepository.js";
import { buildPublicStudentResponse } from "../../services/studentLookupService.js";
import { publicProcedure, router } from "../trpc.js";

export const lookupRouter = router({
  searchStudent: publicProcedure
    .input(lookupSearchInputSchema)
    .output(studentLookupPublicSchema.array())
    .query(async ({ input }) => {
      const records = await searchStudentLookupRecords(input);

      return records.map(buildPublicStudentResponse);
    }),
});
