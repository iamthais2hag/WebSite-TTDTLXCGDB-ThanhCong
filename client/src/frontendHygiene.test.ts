import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const srcRoot = dirname(fileURLToPath(import.meta.url));
const assetsRoot = join(srcRoot, "assets");
const sourceExtensions = new Set([".css", ".ts", ".tsx"]);

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return collectSourceFiles(fullPath);
    }

    return sourceExtensions.has(extname(entry)) ? [fullPath] : [];
  });
}

function readClientSource(): string {
  return collectSourceFiles(srcRoot)
    .map((filePath) => readFileSync(filePath, "utf8"))
    .join("\n");
}

describe("frontend hygiene", () => {
  it("keeps only approved official assets in client assets", () => {
    expect(readdirSync(assetsRoot).sort()).toEqual(
      [
        "a1.png",
        "am.png",
        "b.png",
        "c.png",
        "c1.png",
        "car.mp4",
        "logo-thanh-cong.webp",
        "nh.png",
      ].sort(),
    );
  });

  it("does not reference legacy assets or color-changing styles", () => {
    const source = readClientSource();
    const blockedAssetRefs = [
      "A" + "1.png",
      "A" + "M.png",
      "B" + "SCK.png",
      "C" + ".png",
      "C" + "1.png",
      "N" + "H.png",
      "C" + "AR.mp4",
      "mascot" + "-car.png",
      "logo-thanh-cong" + ".png",
    ];
    const blockedStyleRefs = [
      "fi" + "lter",
      "hue" + "-rotate",
      "sat" + "urate",
      "se" + "pia",
      "te" + "al",
      "cy" + "an",
    ];

    for (const blocked of [...blockedAssetRefs, ...blockedStyleRefs]) {
      expect(source).not.toContain(blocked);
    }
  });
});
