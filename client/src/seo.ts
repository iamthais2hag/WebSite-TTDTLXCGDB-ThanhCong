import { useEffect } from "react";
import { type AppRoutePath, ROUTES, normalizePathname } from "./routing";

export const SITE_BASE_URL = "https://thanhcongdaklak.edu.vn";

export type PageMeta = {
  canonicalUrl: string;
  description: string;
  title: string;
};

function buildCanonicalUrl(route: AppRoutePath) {
  if (route === ROUTES.home) {
    return `${SITE_BASE_URL}/`;
  }

  return `${SITE_BASE_URL}${route}`;
}

export const ROUTE_META: Record<AppRoutePath, PageMeta> = {
  [ROUTES.home]: {
    canonicalUrl: buildCanonicalUrl(ROUTES.home),
    title: "Trung Tâm Đào Tạo Lái Xe Thành Công Đắk Lắk",
    description:
      "Trung Tâm Đào Tạo Lái Xe Cơ Giới Đường Bộ Thành Công - đào tạo lái xe mô tô, ô tô và nâng hạng giấy phép lái xe tại Đắk Lắk.",
  },
  [ROUTES.enrollment]: {
    canonicalUrl: buildCanonicalUrl(ROUTES.enrollment),
    title: "Tuyển sinh lái xe Thành Công Đắk Lắk",
    description:
      "Thông tin tuyển sinh các hạng A1, A, B, C1 và nâng hạng giấy phép lái xe tại Trung tâm Thành Công.",
  },
  [ROUTES.lookup]: {
    canonicalUrl: buildCanonicalUrl(ROUTES.lookup),
    title: "Tra cứu học viên - Trung tâm Thành Công",
    description:
      "Tra cứu thông tin học viên theo CCCD tại Trung Tâm Đào Tạo Lái Xe Cơ Giới Đường Bộ Thành Công.",
  },
  [ROUTES.announcements]: {
    canonicalUrl: buildCanonicalUrl(ROUTES.announcements),
    title: "Thông báo - Trung tâm Thành Công",
    description:
      "Cập nhật thông báo đào tạo, lịch học, lịch kiểm tra và thông tin liên quan từ Trung tâm Thành Công.",
  },
  [ROUTES.legal]: {
    canonicalUrl: buildCanonicalUrl(ROUTES.legal),
    title: "Pháp lý đào tạo lái xe - Trung tâm Thành Công",
    description:
      "Thông tin pháp lý, quy định đào tạo lái xe và các văn bản liên quan.",
  },
};

export const DEFAULT_PAGE_META = ROUTE_META[ROUTES.home];

function getMetaElement(
  selector: string,
  attributeName: "name" | "property",
  attributeValue: string,
  doc: Document
) {
  const currentMeta = doc.querySelector<HTMLMetaElement>(selector);

  if (currentMeta) {
    return currentMeta;
  }

  const metaElement = doc.createElement("meta");
  metaElement.setAttribute(attributeName, attributeValue);
  doc.head.append(metaElement);
  return metaElement;
}

function getDescriptionMetaElement(doc: Document) {
  return getMetaElement(
    'meta[name="description"]',
    "name",
    "description",
    doc
  );
}

function getCanonicalLinkElement(doc: Document) {
  const currentLink = doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (currentLink) {
    return currentLink;
  }

  const linkElement = doc.createElement("link");
  linkElement.setAttribute("rel", "canonical");
  doc.head.append(linkElement);
  return linkElement;
}

export function getPageMeta(pathname: string): PageMeta {
  const route = normalizePathname(pathname);
  return ROUTE_META[route] ?? DEFAULT_PAGE_META;
}

export function applyPageMeta(
  route: AppRoutePath,
  doc: Document = document
): PageMeta {
  const meta = getPageMeta(route);

  doc.title = meta.title;
  getDescriptionMetaElement(doc).setAttribute("content", meta.description);
  getCanonicalLinkElement(doc).setAttribute("href", meta.canonicalUrl);
  getMetaElement('meta[property="og:title"]', "property", "og:title", doc)
    .setAttribute("content", meta.title);
  getMetaElement(
    'meta[property="og:description"]',
    "property",
    "og:description",
    doc
  ).setAttribute("content", meta.description);
  getMetaElement('meta[property="og:type"]', "property", "og:type", doc)
    .setAttribute("content", "website");
  getMetaElement('meta[property="og:url"]', "property", "og:url", doc)
    .setAttribute("content", meta.canonicalUrl);
  getMetaElement('meta[name="twitter:card"]', "name", "twitter:card", doc)
    .setAttribute("content", "summary");

  return meta;
}

export function usePageMeta(route: AppRoutePath) {
  useEffect(() => {
    applyPageMeta(route);
  }, [route]);
}
