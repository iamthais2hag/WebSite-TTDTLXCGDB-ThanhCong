import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { StudentLookupPublic } from "shared";
import { StudentCard } from "./StudentCard";

const appCss = readFileSync(
  fileURLToPath(new URL("../App.css", import.meta.url)),
  "utf8",
);

const student: StudentLookupPublic = {
  diaChi: "Đắk Lắk",
  gioiTinh: "Nữ",
  hang: "B",
  hoVaTen: "Trần Thị B",
  ngaySinh: "02/02/2001",
  photoUrl: "/uploads/students/K45/DK001.jpg",
  soCMTMasked: "********9012",
  tenKhoaHoc: "K45",
};

describe("StudentCard", () => {
  it("renders public student information", () => {
    const markup = renderToStaticMarkup(createElement(StudentCard, { student }));

    expect(markup).toContain("Trần Thị B");
    expect(markup).toContain("********9012");
    expect(markup).toContain("02/02/2001");
    expect(markup).toContain("Nữ");
    expect(markup).toContain("Đắk Lắk");
    expect(markup).toContain("K45");
    expect(markup).toContain(">B<");
  });

  it("does not render raw CCCD or internal fields", () => {
    const markup = renderToStaticMarkup(createElement(StudentCard, { student }));

    expect(markup).not.toContain("123456789012");
    expect(markup).not.toContain("MaDK");
    expect(markup).not.toContain("MaKhoaHoc");
    expect(markup).not.toContain("HangDaoTao");
    expect(markup).not.toContain("LoaiDaoTao");
    expect(markup).not.toContain("sourceUpdatedAt");
    expect(markup).not.toContain("syncedAt");
  });

  it("renders public photoUrl with 3x4 contain styling", () => {
    const markup = renderToStaticMarkup(createElement(StudentCard, { student }));

    expect(markup).toContain('src="/uploads/students/K45/DK001.jpg"');
    expect(markup).toContain("student-card__photo-frame");
    expect(markup).toContain("student-card__photo");
    expect(appCss).toContain("aspect-ratio: 3 / 4");
    expect(appCss).toContain("object-fit: contain");
    expect(appCss).not.toMatch(/object-fit:\s*co[v]er/);
  });

  it("renders a polite placeholder when photoUrl is missing", () => {
    const markup = renderToStaticMarkup(
      createElement(StudentCard, {
        student: {
          ...student,
          photoUrl: null,
        },
      }),
    );

    expect(markup).toContain("Chưa có ảnh");
    expect(markup).not.toContain("<img");
  });

  it("does not render non-public physical photo paths", () => {
    const markup = renderToStaticMarkup(
      createElement(StudentCard, {
        student: {
          ...student,
          photoUrl: "C:/uploads/students/K45/DK001.jpg",
        },
      }),
    );

    expect(markup).toContain("Chưa có ảnh");
    expect(markup).not.toContain("C:/uploads");
  });
});
