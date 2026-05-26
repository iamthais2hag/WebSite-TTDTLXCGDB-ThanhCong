import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { App } from "./App";
import { APP_NAV_ITEMS } from "./siteConfig";

const appCss = readFileSync(
  fileURLToPath(new URL("./App.css", import.meta.url)),
  "utf8",
);

describe("App shell", () => {
  it("keeps the expected public navigation order", () => {
    expect(APP_NAV_ITEMS.map((item) => item.label)).toEqual([
      "Trang chủ",
      "Tuyển sinh",
      "Tra cứu",
      "Thông báo",
      "Pháp lý",
    ]);
    expect(APP_NAV_ITEMS[0]?.label).toBe("Trang chủ");
    expect(APP_NAV_ITEMS[1]?.label).toBe("Tuyển sinh");
  });

  it("renders layout, header, navigation, and footer", () => {
    const markup = renderToStaticMarkup(createElement(App));

    expect(markup).toContain("site-header");
    expect(markup).toContain("site-brand__mark");
    expect(markup).toContain("site-nav__link--active");
    expect(markup).toContain("Điều hướng chính");
    expect(markup).toContain("site-footer");
    expect(markup).toContain("Trang chủ");
    expect(markup).toContain("Tuyển sinh");
    expect(markup).toContain("Tra cứu");
    expect(markup).toContain("Thông báo");
    expect(markup).toContain("Pháp lý");
    expect(markup).toContain("TRUNG TÂM ĐÀO TẠO LÁI XE CƠ GIỚI ĐƯỜNG BỘ");
    expect(markup).toContain("THÀNH CÔNG");
    expect(markup).toContain("Vững tay lái – Vững bước thành công");
    expect(markup).toContain("Đăng ký tư vấn");
  });

  it("renders the basic public pages in the old-site order", () => {
    const markup = renderToStaticMarkup(createElement(App));
    const homeIndex = markup.indexOf("Học lái xe bài bản,");
    const enrollmentIndex = markup.indexOf("Các nhóm đào tạo");
    const lookupIndex = markup.indexOf("Khu vực tra cứu thông tin đăng ký học");
    const announcementsIndex = markup.indexOf("Thông báo mới");
    const legalIndex = markup.indexOf("Văn bản và hướng dẫn liên quan");

    expect(homeIndex).toBeGreaterThanOrEqual(0);
    expect(enrollmentIndex).toBeGreaterThan(homeIndex);
    expect(lookupIndex).toBeGreaterThan(enrollmentIndex);
    expect(announcementsIndex).toBeGreaterThan(lookupIndex);
    expect(legalIndex).toBeGreaterThan(announcementsIndex);
  });

  it("renders all approved enrollment groups", () => {
    const markup = renderToStaticMarkup(createElement(App));

    expect(markup).toContain("A1");
    expect(markup).toContain("A/AM");
    expect(markup).toContain("B số sàn/số cơ khí/số tự động");
    expect(markup).toContain("C1");
    expect(markup).toContain(">C<");
    expect(markup).toContain("Nâng hạng");
  });

  it("renders the old-site hero visual content and official car video proportionally", () => {
    const markup = renderToStaticMarkup(createElement(App));
    const normalizedMarkup = markup.toLowerCase();

    expect(markup).toContain("site-brand__logo");
    expect(markup).toContain("hero-card");
    expect(markup).toContain("TUYỂN SINH THƯỜNG XUYÊN");
    expect(markup).toContain("Học lái xe bài bản,");
    expect(markup).toContain("sát hạch đúng chuẩn");
    expect(markup).toContain("Xem khóa học");
    expect(markup).toContain("Gọi 0926 236 239");
    expect(markup).toContain("Khai giảng liên tục");
    expect(markup).toContain("Tư vấn rõ ràng");
    expect(markup).toContain("Học thực hành bài bản");
    expect(markup).toContain("Khai giảng");
    expect(markup).toContain("Liên tục");
    expect(markup).toContain("Uy tín");
    expect(markup).toContain("Thông tin rõ ràng");
    expect(markup).toContain("Tận tâm");
    expect(markup).toContain("Đồng hành học viên");
    expect(markup).toContain("Bài bản");
    expect(markup).toContain("Học đúng chuẩn");
    expect(markup).toContain("hero-banner__mascot");
    expect(normalizedMarkup).toContain("<video");
    expect(normalizedMarkup).toContain("autoplay=\"\"");
    expect(normalizedMarkup).toContain("muted=\"\"");
    expect(normalizedMarkup).toContain("loop=\"\"");
    expect(normalizedMarkup).toContain("playsinline=\"\"");
    expect(normalizedMarkup).toContain("preload=\"metadata\"");
    expect(normalizedMarkup).toContain("car.mp4");
    expect(appCss).toContain("object-fit: contain");
    expect(appCss).toContain("height: auto");
    for (const forbiddenText of ["za" + "lo"]) {
      expect(normalizedMarkup).not.toContain(forbiddenText);
    }
  });
});
