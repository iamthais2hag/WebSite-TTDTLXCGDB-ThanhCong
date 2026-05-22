import { lookupSearchInputSchema, studentLookupPublicSchema } from "shared";
import { assertLookupRateLimit } from "../../services/lookupRateLimit.js";
import { searchStudentLookupRecords } from "../../services/studentLookupRepository.js";
import { buildPublicStudentResponse } from "../../services/studentLookupService.js";
import { middleware, publicProcedure, router } from "../trpc.js";

const rateLimitedLookupProcedure = publicProcedure.use(
  middleware(({ ctx, next }) => {
    assertLookupRateLimit(ctx.req);

    return next();
  })
);

export const lookupRouter = router({
  searchStudent: rateLimitedLookupProcedure
    .input(lookupSearchInputSchema)
    .output(studentLookupPublicSchema.array())
    .query(async ({ input }) => {
      const records = await searchStudentLookupRecords(input);

      return records.map(buildPublicStudentResponse);
    }),
});
