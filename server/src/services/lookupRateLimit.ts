import { TRPCError } from "@trpc/server";
import type { Context } from "../trpc/context.js";

export const lookupRateLimitMessage =
  "Bạn đã tra cứu quá nhiều lần. Vui lòng thử lại sau 1 phút.";

export const lookupRateLimitMaxRequests = 10;
const lookupRateLimitWindowMs = 60_000;

type RateLimitBucket = {
  count: number;
  windowStart: number;
};

const buckets = new Map<string, RateLimitBucket>();

function getClientIp(req: Context["req"]): string {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function assertLookupRateLimit(
  req: Context["req"],
  now = Date.now()
): void {
  const clientIp = getClientIp(req);
  const bucket = buckets.get(clientIp);

  if (!bucket || now - bucket.windowStart >= lookupRateLimitWindowMs) {
    buckets.set(clientIp, {
      count: 1,
      windowStart: now,
    });
    return;
  }

  if (bucket.count >= lookupRateLimitMaxRequests) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: lookupRateLimitMessage,
    });
  }

  bucket.count += 1;
}

export function resetLookupRateLimitForTests(): void {
  buckets.clear();
}
