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
      "Tra cứu học viên",
      "Thông báo",
      "Pháp lý",
      "Tuyển sinh",
    ]);
    expect(APP_NAV_ITEMS[0]?.label).not.toBe("Tuyển sinh");
    expect(APP_NAV_ITEMS.at(-1)?.label).toBe("Tuyển sinh");
  });

  it("renders layout, header, navigation, and footer", () => {
    const markup = renderToStaticMarkup(createElement(App));

    expect(markup).toContain("site-header");
    expect(markup).toContain("Điều hướng chính");
    expect(markup).toContain("site-footer");
    expect(markup).toContain("Trang chủ");
    expect(markup).toContain("Tra cứu học viên");
    expect(markup).toContain("Thông báo");
    expect(markup).toContain("Pháp lý");
    expect(markup).toContain("Tuyển sinh");
  });

  it("renders the basic public pages in the approved order", () => {
    const markup = renderToStaticMarkup(createElement(App));
    const homeIndex = markup.indexOf("Trung tâm Đào tạo Lái xe Thành Công");
    const lookupIndex = markup.indexOf("Khu vực tra cứu thông tin đăng ký học");
    const announcementsIndex = markup.indexOf("Thông báo mới");
    const legalIndex = markup.indexOf("Văn bản và hướng dẫn liên quan");
    const enrollmentIndex = markup.indexOf("Các nhóm đào tạo");

    expect(homeIndex).toBeGreaterThanOrEqual(0);
    expect(lookupIndex).toBeGreaterThan(homeIndex);
    expect(announcementsIndex).toBeGreaterThan(lookupIndex);
    expect(legalIndex).toBeGreaterThan(announcementsIndex);
    expect(enrollmentIndex).toBeGreaterThan(legalIndex);
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

  it("renders the official car video proportionally and avoids top-page contact shortcuts", () => {
    const markup = renderToStaticMarkup(createElement(App));
    const normalizedMarkup = markup.toLowerCase();

    expect(markup).toContain("site-brand__logo");
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
    for (const forbiddenText of ["za" + "lo", "hot" + "line"]) {
      expect(normalizedMarkup).not.toContain(forbiddenText);
    }
  });
});
