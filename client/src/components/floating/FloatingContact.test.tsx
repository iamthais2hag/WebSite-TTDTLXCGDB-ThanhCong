import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ZALO_OA_URL } from "../../siteConfig";
import { BabyCarWidget, calculatePupilOffset } from "./BabyCarWidget";
import { FloatingContact } from "./FloatingContact";

describe("FloatingContact", () => {
  it("renders the quick contact stack in the required order", () => {
    const markup = renderToStaticMarkup(createElement(FloatingContact));
    const babyCarIndex = markup.indexOf("Baby car");
    const zaloIndex = markup.indexOf("Chat Zalo OA");
    const phoneIndex = markup.indexOf("Gọi điện tư vấn");

    expect(babyCarIndex).toBeGreaterThanOrEqual(0);
    expect(zaloIndex).toBeGreaterThan(babyCarIndex);
    expect(phoneIndex).toBeGreaterThan(zaloIndex);
    expect(markup).toContain(`href="${ZALO_OA_URL}"`);
    expect(markup).toContain('href="tel:0926236239"');
  });

  it("renders the baby car SVG with two eyes and two pupils", () => {
    const markup = renderToStaticMarkup(createElement(BabyCarWidget));

    expect(markup).toContain("<svg");
    expect(markup).toContain("TẬP LÁI");
    expect(markup.match(/class="baby-car__eye"/g)).toHaveLength(2);
    expect(markup.match(/class="baby-car__pupil"/g)).toHaveLength(2);
  });

  it("keeps pupil movement clamped and safe for reduced-motion environments", () => {
    const offset = calculatePupilOffset(1000, 1000, 0, 0, 7);

    expect(Math.hypot(offset.x, offset.y)).toBeLessThanOrEqual(7.01);
    expect(() => renderToStaticMarkup(createElement(BabyCarWidget))).not.toThrow();
  });

  it("does not render legacy assets or unapproved vehicle classes", () => {
    const markup = renderToStaticMarkup(createElement(FloatingContact));

    expect(markup).not.toContain("mascot" + "-car.png");
    expect(markup).not.toContain("A2");
    expect(markup).not.toContain(">D<");
    expect(markup).not.toContain(">E<");
    expect(markup).not.toContain(">F<");
  });
});
