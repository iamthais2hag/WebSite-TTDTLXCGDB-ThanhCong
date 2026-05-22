import { timingSafeEqual } from "node:crypto";

export type SyncSecretHeader = string | string[] | undefined;

export function getSingleHeaderValue(value: SyncSecretHeader): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function isValidSyncSecret(
  receivedSecret: SyncSecretHeader,
  expectedSecret = process.env.SYNC_SECRET
): boolean {
  const received = getSingleHeaderValue(receivedSecret);

  if (!expectedSecret || !received) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedSecret, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
