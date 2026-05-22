import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  SyncApiClient,
  SyncApiClientError,
  createSyncApiClient,
  type FetchLike,
  type SyncPushRecord,
} from "./apiClient.js";

const testSecret = "test-sync-secret";
const apiUrl = "https://api.example.test";

const validRecord: SyncPushRecord = {
  MaDK: "DK001",
  HoVaTen: "Nguyen Van A",
  SoCMT: "012345678901",
  NgaySinh: "19900101",
  GioiTinh: "Nam",
  DiaChi: "Dak Lak",
  TenKhoaHoc: "Khoa 45",
  Hang: "B2",
  MaKhoaHoc: "K45",
  HangDaoTao: "B2",
  photoUrl: "/uploads/students/K45/DK001.jpg",
  sourceUpdatedAt: "2026-05-21T10:30:00.000Z",
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function createFetchMock(payload: unknown, status = 200) {
  return vi.fn(
    async (_input: string | URL, _init?: RequestInit): Promise<Response> =>
      jsonResponse(payload, status)
  );
}

describe("sync-tool API client", () => {
  it("creates config from env without hardcoded API URL or secret", () => {
    const fetchMock = createFetchMock({});
    const client = createSyncApiClient(
      {
        fetchFn: fetchMock as FetchLike,
      },
      {
        API_URL: `${apiUrl}/`,
        SYNC_SECRET: testSecret,
      }
    );

    expect(client).toBeInstanceOf(SyncApiClient);
  });

  it("pushBatch sends tRPC sync.pushBatch request with sync secret header", async () => {
    const fetchMock = createFetchMock({
      result: {
        data: {
          json: {
            success: true,
            processed: 1,
            validated: 1,
            upserted: 1,
          },
        },
      },
    });
    const client = new SyncApiClient({
      apiUrl: `${apiUrl}/`,
      syncSecret: testSecret,
      fetchFn: fetchMock as FetchLike,
    });

    await expect(
      client.pushBatch({
        records: [validRecord],
      })
    ).resolves.toEqual({
      success: true,
      processed: 1,
      validated: 1,
      upserted: 1,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];

    expect(url).toBe(`${apiUrl}/api/trpc/sync.pushBatch`);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({
      "Content-Type": "application/json",
      "X-SYNC-SECRET": testSecret,
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      json: {
        records: [validRecord],
      },
    });
    expect(String(url)).not.toContain("lookup");
    expect(String(url)).not.toContain("/api/sync/");
  });

  it("uploadStudentPhoto sends multipart form data to REST student-photo", async () => {
    const fetchMock = createFetchMock({
      success: true,
      photoUrl: "/uploads/students/K45/DK001.jpg",
    });
    const client = new SyncApiClient({
      apiUrl,
      syncSecret: testSecret,
      fetchFn: fetchMock as FetchLike,
    });

    await expect(
      client.uploadStudentPhoto({
        MaKhoaHoc: "K45",
        MaDK: "DK001",
        photo: new Uint8Array([1, 2, 3]),
        filename: "K45_DK001.jpg",
      })
    ).resolves.toEqual({
      success: true,
      photoUrl: "/uploads/students/K45/DK001.jpg",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    const body = init?.body as FormData;

    expect(url).toBe(`${apiUrl}/api/sync/student-photo`);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({
      "X-SYNC-SECRET": testSecret,
    });
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("MaKhoaHoc")).toBe("K45");
    expect(body.get("MaDK")).toBe("DK001");
    expect(body.get("photo")).toBeInstanceOf(Blob);
  });

  it("throws safe errors without leaking secret or raw SoCMT", async () => {
    const fetchMock = createFetchMock(
      {
        error: {
          message: `server failure ${testSecret} ${validRecord.SoCMT}`,
        },
      },
      500
    );
    const client = new SyncApiClient({
      apiUrl,
      syncSecret: testSecret,
      fetchFn: fetchMock as FetchLike,
    });

    await expect(
      client.pushBatch({
        records: [validRecord],
      })
    ).rejects.toMatchObject({
      name: "SyncApiClientError",
      message: "Khong the dong bo batch",
      status: 500,
    });

    try {
      await client.pushBatch({
        records: [validRecord],
      });
    } catch (error) {
      expect(error).toBeInstanceOf(SyncApiClientError);
      const message = error instanceof Error ? error.message : String(error);
      expect(message).not.toContain(testSecret);
      expect(message).not.toContain(validRecord.SoCMT);
      expect(message).not.toContain("password");
    }
  });

  it("does not log sync secret while sending requests", async () => {
    const fetchMock = createFetchMock({
      result: {
        data: {
          json: {
            success: true,
            processed: 1,
          },
        },
      },
    });
    const client = new SyncApiClient({
      apiUrl,
      syncSecret: testSecret,
      fetchFn: fetchMock as FetchLike,
    });
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const consoleWarn = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      await client.pushBatch({
        records: [validRecord],
      });

      const loggedText = [
        ...consoleLog.mock.calls,
        ...consoleWarn.mock.calls,
        ...consoleError.mock.calls,
      ]
        .flat()
        .join(" ");

      expect(loggedText).not.toContain(testSecret);
      expect(loggedText).not.toContain(validRecord.SoCMT);
    } finally {
      consoleLog.mockRestore();
      consoleWarn.mockRestore();
      consoleError.mockRestore();
    }
  });

  it("does not contain ZIP or batch photo upload code", async () => {
    const source = await readFile(
      fileURLToPath(new URL("./apiClient.ts", import.meta.url)),
      "utf8"
    );
    const batchPhotoRoute = ["student", "photo", "batch"].join("-");
    const archivePhotoField = ["photos", "Zip"].join("");

    expect(source).not.toContain(batchPhotoRoute);
    expect(source).not.toContain(archivePhotoField);
  });
});
