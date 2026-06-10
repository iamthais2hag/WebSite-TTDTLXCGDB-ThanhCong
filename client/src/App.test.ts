import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { App, AppRouteContent } from "./App";
import { EnrollmentPage } from "./pages/EnrollmentPage";
import { ROUTES, isRouteActive, normalizePathname } from "./routing";
import { APP_NAV_ITEMS, SITE_AGENCY_NAME, SITE_BRAND_NAME, SITE_SLOGAN, ZALO_OA_URL } from "./siteConfig";

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
    expect(APP_NAV_ITEMS[0]?.label).not.toBe("Tuyển sinh");
    expect(APP_NAV_ITEMS[1]?.label).toBe("Tuyển sinh");
  });

  it("uses standalone frontend routes and active route matching", () => {
    expect(APP_NAV_ITEMS.map((item) => item.href)).toEqual([
      ROUTES.home,
      ROUTES.enrollment,
      ROUTES.lookup,
      ROUTES.announcements,
      ROUTES.legal,
    ]);
    expect(normalizePathname("/")).toBe(ROUTES.home);
    expect(normalizePathname("/tuyen-sinh")).toBe(ROUTES.enrollment);
    expect(normalizePathname("/tra-cuu/")).toBe(ROUTES.lookup);
    expect(normalizePathname("/thong-bao")).toBe(ROUTES.announcements);
    expect(normalizePathname("/phap-ly")).toBe(ROUTES.legal);
    expect(normalizePathname("/khong-ton-tai")).toBe(ROUTES.home);
    expect(isRouteActive(ROUTES.lookup, ROUTES.lookup)).toBe(true);
    expect(isRouteActive(ROUTES.lookup, ROUTES.enrollment)).toBe(false);
  });

  it("renders layout, header, navigation, and footer", () => {
    const markup = renderToStaticMarkup(createElement(App));

    expect(markup).toContain("site-header");
    expect(markup).toContain("site-brand__logo");
    expect(markup).toContain("site-nav__link--active");
    expect(markup).toContain("Điều hướng chính");
    expect(markup).toContain("site-footer");
    expect(markup).toContain("Trang chủ");
    expect(markup).toContain("Tra cứu");
    expect(markup).toContain("Thông báo");
    expect(markup).toContain("Pháp lý");
    expect(markup).toContain("Tuyển sinh");
    expect(markup).toContain(SITE_AGENCY_NAME);
    expect(markup).toContain(SITE_BRAND_NAME);
    expect(markup).toContain(SITE_SLOGAN);
    expect(markup).toContain("5000+");
    expect(markup).toContain("overview-card__icon");
    expect(markup).toContain("overview-stat-card--compact");
    expect(markup).toContain("overview-stat-card__header");
    expect(markup).toContain("overview-stat-card__title");
    expect(markup).toContain("Đăng ký tư vấn");
    expect(appCss).toContain("Be Vietnam Pro");
  });

  it("renders one public route content area at a time", () => {
    const homeMarkup = renderToStaticMarkup(createElement(AppRouteContent, { route: ROUTES.home }));
    const enrollmentMarkup = renderToStaticMarkup(createElement(AppRouteContent, { route: ROUTES.enrollment }));
    const lookupMarkup = renderToStaticMarkup(createElement(AppRouteContent, { route: ROUTES.lookup }));
    const announcementsMarkup = renderToStaticMarkup(createElement(AppRouteContent, { route: ROUTES.announcements }));
    const legalMarkup = renderToStaticMarkup(createElement(AppRouteContent, { route: ROUTES.legal }));

    expect(homeMarkup).toContain("Học lái xe bài bản,");
    expect(homeMarkup).toContain("Giới thiệu trung tâm");
    expect(homeMarkup).not.toContain("Danh sách hạng đào tạo");
    expect(enrollmentMarkup).toContain("Danh sách hạng đào tạo");
    expect(lookupMarkup).toContain("Khu vực tra cứu thông tin đăng ký học");
    expect(announcementsMarkup).toContain("Thông báo mới");
    expect(legalMarkup).toContain("Văn bản và hướng dẫn liên quan");
  });

  it("renders all approved enrollment groups", () => {
    const markup = renderToStaticMarkup(createElement(EnrollmentPage));

    expect(markup).toContain("A1");
    expect(markup).toContain("A/AM");
    expect(markup).toContain("B số sàn/số cơ khí/số tự động");
    expect(markup).toContain("C1");
    expect(markup).toContain("Ô tô tải hạng C");
    expect(markup).toContain("Nâng hạng giấy phép lái xe");
    expect(markup).toContain('aria-haspopup="dialog"');
    expect(markup).toContain('data-course-code="A1"');
    expect(markup).toContain("Học đến thi:");
    expect(markup).not.toContain("training-card__badge");
    expect(markup).not.toContain("training-card__group-name");
    expect(markup).toContain("Sẵn sàng bắt đầu hành trình học lái xe?");
    expect(markup).toContain("Xem chi tiết tuyển sinh");
    expect(markup).toContain('href="/tuyen-sinh"');
    expect(markup).toContain("Liên hệ qua Zalo");
    expect(markup).toContain(`href="${ZALO_OA_URL}"`);
    expect(markup).toContain("Gọi điện tư vấn");
    expect(markup).not.toContain('role="dialog"');
    expect(markup).not.toContain("A2");
    expect(markup).not.toContain(">D<");
    expect(markup).not.toContain(">E<");
    expect(markup).not.toContain(">F<");
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
    expect(markup).toContain("Đăng ký tư vấn");
    expect(markup).toContain("Gọi điện tư vấn");
    const previousVisiblePhone = "0926 " + "236 " + "239";
    expect(markup).not.toContain(`Gọi ${previousVisiblePhone}`);
    expect(markup).not.toContain(previousVisiblePhone);
    expect(markup).toContain('href="tel:0926236239"');
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
    expect(appCss).not.toContain("object-fit: " + "cover");
    const heroStart = normalizedMarkup.indexOf("hero-banner");
    const overviewStart = normalizedMarkup.indexOf("overview-section");
    const heroMarkup = normalizedMarkup.slice(heroStart, overviewStart);
    expect(heroMarkup).not.toContain("za" + "lo");
    for (const forbiddenText of [
      "mascot" + "-car.png",
      "/" + "ma" + "nus-storage",
    ]) {
      expect(normalizedMarkup).not.toContain(forbiddenText);
    }
  });

  it("defines mobile responsive safeguards for header, content, floating contact, and modal", () => {
    expect(appCss).toContain("@media (max-width: 768px)");
    expect(appCss).toContain("@media (max-width: 480px)");
    expect(appCss).toContain("overflow-x: clip");
    expect(appCss).toContain(".course-modal__panel--bottom-sheet");
    expect(appCss).toContain("max-height: 90vh");
    expect(appCss).toContain(".floating-contact");
    expect(appCss).toContain("width: 56px");
    expect(appCss).toContain("flex-wrap: wrap");
    expect(appCss).toContain("width: 44px");
    expect(appCss).toContain("width: 34px");
    expect(appCss).toContain("clip-path: inset(50%)");
    expect(appCss).toContain("grid-template-columns: 1fr");
  });
});
