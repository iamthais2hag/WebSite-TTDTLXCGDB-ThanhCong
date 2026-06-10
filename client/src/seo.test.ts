import { beforeEach, describe, expect, it } from "vitest";
import {
  ORGANIZATION_JSON_LD,
  ROUTE_META,
  applyPageMeta,
  getPageMeta,
} from "./seo";
import { ROUTES, type AppRoutePath } from "./routing";

type FakeHeadElement = {
  attributes: Record<string, string>;
  getAttribute: (name: string) => string | null;
  setAttribute: (name: string, value: string) => void;
  textContent: string;
};

type FakeDocument = Document & {
  linkElements: FakeHeadElement[];
  metaElements: FakeHeadElement[];
  scriptElements: FakeHeadElement[];
};

function createFakeElement(): FakeHeadElement {
  return {
    attributes: {},
    textContent: "",
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
    linkElements: [] as FakeHeadElement[],
    metaElements: [] as FakeHeadElement[],
    scriptElements: [] as FakeHeadElement[],
    title: "",
    createElement(tagName: string) {
      if (tagName !== "meta" && tagName !== "link" && tagName !== "script") {
        throw new Error(`Unsupported tag in SEO test: ${tagName}`);
      }

      return createFakeElement();
    },
    head: {
      append(element: FakeHeadElement) {
        if (element.getAttribute("rel") === "canonical") {
          fakeDocument.linkElements.push(element);
          return;
        }

        if (element.getAttribute("type") === "application/ld+json") {
          fakeDocument.scriptElements.push(element);
          return;
        }

        fakeDocument.metaElements.push(element);
      },
    },
    querySelector(selector: string) {
      if (selector === 'link[rel="canonical"]') {
        return (
          fakeDocument.linkElements.find(
            (linkElement) => linkElement.getAttribute("rel") === "canonical"
          ) ?? null
        );
      }

      if (
        selector ===
        'script[type="application/ld+json"][data-schema="organization"]'
      ) {
        return (
          fakeDocument.scriptElements.find(
            (scriptElement) =>
              scriptElement.getAttribute("type") === "application/ld+json" &&
              scriptElement.getAttribute("data-schema") === "organization"
          ) ?? null
        );
      }

      const nameMatch = selector.match(/^meta\[name="([^"]+)"\]$/);
      if (nameMatch) {
        const [, name] = nameMatch;
        return (
          fakeDocument.metaElements.find(
            (metaElement) => metaElement.getAttribute("name") === name
          ) ?? null
        );
      }

      const propertyMatch = selector.match(/^meta\[property="([^"]+)"\]$/);
      if (propertyMatch) {
        const [, property] = propertyMatch;
        return (
          fakeDocument.metaElements.find(
            (metaElement) => metaElement.getAttribute("property") === property
          ) ?? null
        );
      }

      return null;
    },
  };

  return fakeDocument as unknown as FakeDocument;
}

describe("route SEO metadata", () => {
  let doc: FakeDocument;

  beforeEach(() => {
    doc = createFakeDocument();
  });

  function canonicalHref() {
    return doc.linkElements[0]?.getAttribute("href");
  }

  function jsonLdContent() {
    const content = doc.scriptElements[0]?.textContent;

    if (!content) {
      throw new Error("Missing JSON-LD content");
    }

    return JSON.parse(content) as Record<string, unknown>;
  }

  function getMetaContent(attributeName: "name" | "property", value: string) {
    return doc.metaElements
      .find((metaElement) => metaElement.getAttribute(attributeName) === value)
      ?.getAttribute("content");
  }

  function countMeta(attributeName: "name" | "property", value: string) {
    let count = 0;

    for (const metaElement of doc.metaElements) {
      if (metaElement.getAttribute(attributeName) === value) {
        count += 1;
      }
    }

    return count;
  }

  function assertRouteMeta(route: AppRoutePath) {
    const meta = ROUTE_META[route];

    applyPageMeta(route, doc);

    expect(doc.title).toBe(meta.title);
    expect(getMetaContent("name", "description")).toBe(meta.description);
    expect(canonicalHref()).toBe(meta.canonicalUrl);
    expect(getMetaContent("property", "og:title")).toBe(meta.title);
    expect(getMetaContent("property", "og:description")).toBe(meta.description);
    expect(getMetaContent("property", "og:type")).toBe("website");
    expect(getMetaContent("property", "og:url")).toBe(meta.canonicalUrl);
    expect(getMetaContent("name", "twitter:card")).toBe("summary");
    expect(jsonLdContent()).toEqual(ORGANIZATION_JSON_LD);
  }

  it("sets title, canonical, Open Graph, and Twitter metadata for the home route", () => {
    assertRouteMeta(ROUTES.home);
    expect(canonicalHref()).toBe("https://thanhcongdaklak.edu.vn/");
  });

  it("sets title, canonical, Open Graph, and Twitter metadata for the enrollment route", () => {
    assertRouteMeta(ROUTES.enrollment);
    expect(canonicalHref()).toBe("https://thanhcongdaklak.edu.vn/tuyen-sinh");
  });

  it("sets title, canonical, Open Graph, and Twitter metadata for the lookup route", () => {
    assertRouteMeta(ROUTES.lookup);
    expect(canonicalHref()).toBe("https://thanhcongdaklak.edu.vn/tra-cuu");
  });

  it("sets title, canonical, Open Graph, and Twitter metadata for the announcements route", () => {
    assertRouteMeta(ROUTES.announcements);
    expect(canonicalHref()).toBe("https://thanhcongdaklak.edu.vn/thong-bao");
  });

  it("sets title, canonical, Open Graph, and Twitter metadata for the legal route", () => {
    assertRouteMeta(ROUTES.legal);
    expect(canonicalHref()).toBe("https://thanhcongdaklak.edu.vn/phap-ly");
  });

  it("uses the home metadata for unknown fallback routes", () => {
    expect(getPageMeta("/khong-ton-tai")).toEqual(ROUTE_META[ROUTES.home]);
  });

  it("updates existing SEO tags instead of duplicating them across route changes", () => {
    const existingMeta = doc.createElement("meta") as unknown as FakeHeadElement;
    existingMeta.setAttribute("name", "description");
    existingMeta.setAttribute("content", "old");
    doc.head.append(existingMeta as unknown as Node);

    applyPageMeta(ROUTES.lookup, doc);
    applyPageMeta(ROUTES.legal, doc);

    expect(countMeta("name", "description")).toBe(1);
    expect(countMeta("property", "og:title")).toBe(1);
    expect(countMeta("property", "og:url")).toBe(1);
    expect(doc.linkElements).toHaveLength(1);
    expect(doc.scriptElements).toHaveLength(1);
    expect(existingMeta.getAttribute("content")).toBe(
      ROUTE_META[ROUTES.legal].description
    );
    expect(canonicalHref()).toBe(ROUTE_META[ROUTES.legal].canonicalUrl);
  });

  it("creates safe organization JSON-LD without unconfirmed details", () => {
    applyPageMeta(ROUTES.home, doc);

    const jsonLd = jsonLdContent();

    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toEqual([
      "Organization",
      "LocalBusiness",
      "EducationalOrganization",
    ]);
    expect(jsonLd.name).toBe(
      "TRUNG TÂM ĐÀO TẠO LÁI XE CƠ GIỚI ĐƯỜNG BỘ THÀNH CÔNG"
    );
    expect(jsonLd.url).toBe("https://thanhcongdaklak.edu.vn");
    expect(jsonLd.slogan).toBe("Vững tay lái – Vững bước thành công");
    expect(jsonLd).not.toHaveProperty("address");
    expect(jsonLd).not.toHaveProperty("geo");
    expect(jsonLd).not.toHaveProperty("openingHours");
    expect(jsonLd).not.toHaveProperty("sameAs");
  });
});
