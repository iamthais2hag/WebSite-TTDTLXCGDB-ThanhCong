import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { trainingGroups } from "../pages/EnrollmentPage";
import { CourseDetailModal } from "./CourseDetailModal";

describe("CourseDetailModal", () => {
  it("does not render before a course card is selected", () => {
    const markup = renderToStaticMarkup(
      createElement(CourseDetailModal, {
        course: null,
        onClose: () => undefined,
      }),
    );

    expect(markup).toBe("");
  });

  it("renders confirmed A1 course details and modal controls", () => {
    const markup = renderToStaticMarkup(
      createElement(CourseDetailModal, {
        course: trainingGroups[0],
        onClose: () => undefined,
      }),
    );

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain("Mô tô hạng A1");
    expect(markup).toContain("Hạng A1");
    expect(markup).toContain("Học phí");
    expect(markup).toContain("Liên hệ");
    expect(markup).toContain("Thời gian");
    expect(markup).toContain("1-2 tháng");
    expect(markup).toContain("Loại xe");
    expect(markup).toContain("Mô tô");
    expect(markup).toContain("Điều kiện");
    expect(markup).toContain("Gọi tư vấn");
    expect(markup).toContain("Zalo");
    expect(markup).toContain("Đóng");
    expect(markup).toContain('aria-label="Đóng"');
    expect(markup).toContain('aria-label="Đóng chi tiết hạng đào tạo"');
  });

  it("does not introduce unconfirmed license classes or invented tuition", () => {
    const markup = renderToStaticMarkup(
      createElement(CourseDetailModal, {
        course: trainingGroups[2],
        onClose: () => undefined,
      }),
    );

    expect(markup).not.toContain("A2");
    expect(markup).not.toContain(">D<");
    expect(markup).not.toContain(">E<");
    expect(markup).not.toContain(">F<");
    expect(markup).not.toContain("1.000.000");
    expect(markup).not.toContain("2.000.000");
    expect(markup).not.toContain("3.000.000");
  });
});
