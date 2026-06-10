import { beforeEach, describe, expect, it } from "vitest";
import {
  ROUTE_META,
  applyPageMeta,
  getPageMeta,
} from "./seo";
import { ROUTES } from "./routing";

type FakeMetaElement = {
  attributes: Record<string, string>;
  getAttribute: (name: string) => string | null;
  setAttribute: (name: string, value: string) => void;
};

type FakeDocument = Document & {
  metaElements: FakeMetaElement[];
};

function createFakeMetaElement(): FakeMetaElement {
  return {
    attributes: {},
    getAttribute(name) {
      return this.attributes[name] ?? null;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
}

function createFakeDocument(): FakeDocument {
  const fakeDocument = {
    metaElements: [] as FakeMetaElement[],
    title: "",
    createElement(tagName: string) {
      if (tagName !== "meta") {
        throw new Error(`Unsupported tag in SEO test: ${tagName}`);
      }

      return createFakeMetaElement();
    },
    head: {
      append(metaElement: FakeMetaElement) {
        fakeDocument.metaElements.push(metaElement);
      },
    },
    querySelector(selector: string) {
      if (selector !== 'meta[name="description"]') {
        return null;
      }

      return (
        fakeDocument.metaElements.find(
          (metaElement) => metaElement.getAttribute("name") === "description"
        ) ?? null
      );
    },
  };

  return fakeDocument as unknown as FakeDocument;
}

describe("route SEO metadata", () => {
  let doc: FakeDocument;

  beforeEach(() => {
    doc = createFakeDocument();
  });

  function descriptionContent() {
    return doc.metaElements[0]?.getAttribute("content");
  }

  it("sets title and description for the home route", () => {
    const meta = applyPageMeta(ROUTES.home, doc);

    expect(meta).toEqual(ROUTE_META[ROUTES.home]);
    expect(doc.title).toBe("Trung Tâm Đào Tạo Lái Xe Thành Công Đắk Lắk");
    expect(descriptionContent()).toBe(
      "Trung Tâm Đào Tạo Lái Xe Cơ Giới Đường Bộ Thành Công - đào tạo lái xe mô tô, ô tô và nâng hạng giấy phép lái xe tại Đắk Lắk."
    );
  });

  it("sets title and description for the enrollment route", () => {
    applyPageMeta(ROUTES.enrollment, doc);

    expect(doc.title).toBe("Tuyển sinh lái xe Thành Công Đắk Lắk");
    expect(descriptionContent()).toBe(
      "Thông tin tuyển sinh các hạng A1, A, B, C1 và nâng hạng giấy phép lái xe tại Trung tâm Thành Công."
    );
  });

  it("sets title and description for the lookup route", () => {
    applyPageMeta(ROUTES.lookup, doc);

    expect(doc.title).toBe("Tra cứu học viên - Trung tâm Thành Công");
    expect(descriptionContent()).toBe(
      "Tra cứu thông tin học viên theo CCCD tại Trung Tâm Đào Tạo Lái Xe Cơ Giới Đường Bộ Thành Công."
    );
  });

  it("sets title and description for the announcements route", () => {
    applyPageMeta(ROUTES.announcements, doc);

    expect(doc.title).toBe("Thông báo - Trung tâm Thành Công");
    expect(descriptionContent()).toBe(
      "Cập nhật thông báo đào tạo, lịch học, lịch kiểm tra và thông tin liên quan từ Trung tâm Thành Công."
    );
  });

  it("sets title and description for the legal route", () => {
    applyPageMeta(ROUTES.legal, doc);

    expect(doc.title).toBe("Pháp lý đào tạo lái xe - Trung tâm Thành Công");
    expect(descriptionContent()).toBe(
      "Thông tin pháp lý, quy định đào tạo lái xe và các văn bản liên quan."
    );
  });

  it("uses the home metadata for unknown fallback routes", () => {
    expect(getPageMeta("/khong-ton-tai")).toEqual(ROUTE_META[ROUTES.home]);
  });

  it("updates an existing meta description tag instead of duplicating it", () => {
    const existingMeta = doc.createElement("meta") as unknown as FakeMetaElement;
    existingMeta.setAttribute("name", "description");
    existingMeta.setAttribute("content", "old");
    doc.head.append(existingMeta as unknown as Node);

    applyPageMeta(ROUTES.lookup, doc);

    expect(doc.metaElements).toHaveLength(1);
    expect(existingMeta.getAttribute("content")).toBe(
      "Tra cứu thông tin học viên theo CCCD tại Trung Tâm Đào Tạo Lái Xe Cơ Giới Đường Bộ Thành Công."
    );
  });
});
