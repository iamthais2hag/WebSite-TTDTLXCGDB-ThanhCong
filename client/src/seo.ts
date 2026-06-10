import { useEffect } from "react";
import { type AppRoutePath, ROUTES, normalizePathname } from "./routing";

export type PageMeta = {
  description: string;
  title: string;
};

export const ROUTE_META: Record<AppRoutePath, PageMeta> = {
  [ROUTES.home]: {
    title: "Trung Tâm Đào Tạo Lái Xe Thành Công Đắk Lắk",
    description:
      "Trung Tâm Đào Tạo Lái Xe Cơ Giới Đường Bộ Thành Công - đào tạo lái xe mô tô, ô tô và nâng hạng giấy phép lái xe tại Đắk Lắk.",
  },
  [ROUTES.enrollment]: {
    title: "Tuyển sinh lái xe Thành Công Đắk Lắk",
    description:
      "Thông tin tuyển sinh các hạng A1, A, B, C1 và nâng hạng giấy phép lái xe tại Trung tâm Thành Công.",
  },
  [ROUTES.lookup]: {
    title: "Tra cứu học viên - Trung tâm Thành Công",
    description:
      "Tra cứu thông tin học viên theo CCCD tại Trung Tâm Đào Tạo Lái Xe Cơ Giới Đường Bộ Thành Công.",
  },
  [ROUTES.announcements]: {
    title: "Thông báo - Trung tâm Thành Công",
    description:
      "Cập nhật thông báo đào tạo, lịch học, lịch kiểm tra và thông tin liên quan từ Trung tâm Thành Công.",
  },
  [ROUTES.legal]: {
    title: "Pháp lý đào tạo lái xe - Trung tâm Thành Công",
    description:
      "Thông tin pháp lý, quy định đào tạo lái xe và các văn bản liên quan.",
  },
};

export const DEFAULT_PAGE_META = ROUTE_META[ROUTES.home];

function getDescriptionMetaElement(doc: Document) {
  const currentMeta = doc.querySelector<HTMLMetaElement>(
    'meta[name="description"]'
  );

  if (currentMeta) {
    return currentMeta;
  }

  const metaElement = doc.createElement("meta");
  metaElement.setAttribute("name", "description");
  doc.head.append(metaElement);
  return metaElement;
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
  return meta;
}

export function usePageMeta(route: AppRoutePath) {
  useEffect(() => {
    applyPageMeta(route);
  }, [route]);
}
