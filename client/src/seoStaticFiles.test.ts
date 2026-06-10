import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ROUTES } from "./routing";
import { SITE_BASE_URL } from "./seo";

const robotsTxt = readFileSync(
  fileURLToPath(new URL("../public/robots.txt", import.meta.url)),
  "utf8"
);

const sitemapXml = readFileSync(
  fileURLToPath(new URL("../public/sitemap.xml", import.meta.url)),
  "utf8"
);

function canonicalUrl(route: string) {
  return route === "/" ? `${SITE_BASE_URL}/` : `${SITE_BASE_URL}${route}`;
}

describe("SEO static files", () => {
  it("allows crawlers and points to the official sitemap", () => {
    expect(robotsTxt).toContain("User-agent: *");
    expect(robotsTxt).toContain("Allow: /");
    expect(robotsTxt).toContain(`Sitemap: ${SITE_BASE_URL}/sitemap.xml`);
  });

  it("contains all primary frontend routes in sitemap.xml", () => {
    for (const route of Object.values(ROUTES)) {
      expect(sitemapXml).toContain(`<loc>${canonicalUrl(route)}</loc>`);
    }

    expect(sitemapXml).toContain("<priority>1.0</priority>");
    expect(sitemapXml).toContain("<priority>0.9</priority>");
    expect(sitemapXml).toContain("<priority>0.7</priority>");
    expect(sitemapXml).toContain("<priority>0.6</priority>");
  });
});
