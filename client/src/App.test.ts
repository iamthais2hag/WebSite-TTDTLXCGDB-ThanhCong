import { describe, expect, it } from "vitest";
import { APP_ROUTES } from "./App";

describe("App shell", () => {
  it("keeps the expected public route labels", () => {
    expect(APP_ROUTES).toEqual([
      "Trang chủ",
      "Tra cứu",
      "Thông báo",
      "Pháp lý",
      "Tuyển sinh",
    ]);
  });
});
