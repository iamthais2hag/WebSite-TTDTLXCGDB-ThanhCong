import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LookupSearchInput, StudentLookupPublic } from "shared";
import {
  LookupPage,
  LookupResultList,
  runLookupSearch,
  sanitizeSoCMT,
} from "./LookupPage";

const lookupPageSource = readFileSync(
  fileURLToPath(new URL("./LookupPage.tsx", import.meta.url)),
  "utf8",
);

describe("LookupPage", () => {
  it("renders the lookup form with moto and oto actions", () => {
    const markup = renderToStaticMarkup(
      createElement(LookupPage, {
        searchStudent: async () => [],
      }),
    );

    expect(markup).toContain("lookup-so-cmt");
    expect(markup).toContain("Tra cứu Mô tô");
    expect(markup).toContain("Tra cứu Ô tô");
    expect(markup).toContain("CCCD đã che");
  });

  it("sanitizes CCCD input to digits and 12 characters", () => {
    expect(sanitizeSoCMT("abc1234567890123")).toBe("123456789012");
  });

  it("sends loaiDaoTao=moto to the tRPC lookup call", async () => {
    const calls: LookupSearchInput[] = [];

    await runLookupSearch({
      loaiDaoTao: "moto",
      searchStudent: async (input) => {
        calls.push(input);
        return [];
      },
      soCMT: "123456789012",
    });

    expect(calls).toEqual([
      {
        loaiDaoTao: "moto",
        soCMT: "123456789012",
      },
    ]);
  });

  it("sends loaiDaoTao=oto to the tRPC lookup call", async () => {
    const calls: LookupSearchInput[] = [];

    await runLookupSearch({
      loaiDaoTao: "oto",
      searchStudent: async (input) => {
        calls.push(input);
        return [];
      },
      soCMT: "123456789012",
    });

    expect(calls).toEqual([
      {
        loaiDaoTao: "oto",
        soCMT: "123456789012",
      },
    ]);
  });

  it("does not call the API when CCCD is invalid", async () => {
    let called = false;

    const state = await runLookupSearch({
      loaiDaoTao: "moto",
      searchStudent: async () => {
        called = true;
        return [];
      },
      soCMT: "12345678",
    });

    expect(called).toBe(false);
    expect(state.status).toBe("error");
  });

  it("renders loading and empty states", () => {
    const loadingMarkup = renderToStaticMarkup(
      createElement(LookupResultList, {
        state: {
          loaiDaoTao: "moto",
          status: "loading",
        },
      }),
    );
    const emptyMarkup = renderToStaticMarkup(
      createElement(LookupResultList, {
        state: {
          status: "empty",
        },
      }),
    );

    expect(loadingMarkup).toContain("Đang tra cứu hồ sơ Mô tô");
    expect(emptyMarkup).toContain("Không tìm thấy hồ sơ phù hợp.");
  });

  it("renders public success results without raw CCCD", () => {
    const rawSoCMT = "123456789012";
    const student: StudentLookupPublic = {
      diaChi: "Đắk Lắk",
      gioiTinh: "Nam",
      hang: "A1",
      hoVaTen: "Nguyễn Văn A",
      ngaySinh: "01/01/2000",
      photoUrl: null,
      soCMTMasked: "********9012",
      tenKhoaHoc: "K45",
    };

    const markup = renderToStaticMarkup(
      createElement(LookupResultList, {
        state: {
          results: [student],
          status: "success",
        },
      }),
    );

    expect(markup).toContain("********9012");
    expect(markup).not.toContain(rawSoCMT);
    expect(markup).not.toContain("MaDK");
    expect(markup).not.toContain("MaKhoaHoc");
    expect(markup).not.toContain("HangDaoTao");
  });

  it("uses tRPC for lookup and does not add a REST lookup call", () => {
    expect(lookupPageSource).toContain("trpcClient.lookup.searchStudent.query");
    expect(lookupPageSource).not.toContain("fetch(");
    expect(lookupPageSource).not.toContain("/api/");
    expect(lookupPageSource).not.toContain("student-photo");
  });
});
