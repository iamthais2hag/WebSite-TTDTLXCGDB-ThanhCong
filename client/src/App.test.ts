import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { App } from "./App";
import { APP_NAV_ITEMS } from "./siteConfig";

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

  it("keeps identity assets proportional and avoids top-page contact shortcuts", () => {
    const markup = renderToStaticMarkup(createElement(App));
    const normalizedMarkup = markup.toLowerCase();

    expect(markup).toContain("site-brand__logo");
    expect(markup).toContain("hero-banner__mascot");
    expect(markup).toContain("object-fit:contain");
    expect(markup).toContain("height:auto");
    for (const forbiddenText of ["za" + "lo", "hot" + "line"]) {
      expect(normalizedMarkup).not.toContain(forbiddenText);
    }
  });
});
