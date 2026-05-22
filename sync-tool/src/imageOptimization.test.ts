import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ImageMagickAdapter,
  type ImageCommandRunner,
  type ImageProcessingAdapter,
} from "./imageAdapter.js";
import {
  buildQualityCandidatePath,
  convertAndOptimizeStudentPhoto,
  getFileSizeKB,
} from "./imageOptimization.js";

const inputPath = "source.jp2";
const outputPath = "student.jpg";
const qualityOrder = [88, 85, 82, 78];
const tempRoots: string[] = [];

class FakeImageAdapter implements ImageProcessingAdapter {
  readonly calls: Array<{
    inputPath: string;
    outputPath: string;
    quality: number | undefined;
  }> = [];

  async checkEngineAvailable(): Promise<boolean> {
    return true;
  }

  async convertJp2ToJpg(
    inputFilePath: string,
    outputFilePath: string,
    options: { quality?: number } = {}
  ): Promise<{ outputPath: string }> {
    this.calls.push({
      inputPath: inputFilePath,
      outputPath: outputFilePath,
      quality: options.quality,
    });

    return {
      outputPath: outputFilePath,
    };
  }

  async optimizeJpg(
    _inputFilePath: string,
    outputFilePath: string
  ): Promise<{ outputPath: string }> {
    return {
      outputPath: outputFilePath,
    };
  }
}

afterEach(async () => {
  await Promise.all(
    tempRoots.map((tempRoot) =>
      rm(tempRoot, {
        recursive: true,
        force: true,
      })
    )
  );
  tempRoots.length = 0;
});

describe("student photo adaptive optimization", () => {
  it("runs quality loop in order 88 -> 85 -> 82 -> 78", async () => {
    const adapter = new FakeImageAdapter();
    const logger = {
      warn: vi.fn(),
    };

    await convertAndOptimizeStudentPhoto(inputPath, outputPath, {
      adapter,
      getFileSizeKB: createSizeMock([52, 49, 45, 42]),
      promoteCandidate: createPromoteMock(),
      cleanupCandidate: createCleanupMock(),
      logger,
    });

    expect(adapter.calls.map((call) => call.quality)).toEqual(qualityOrder);
    expect(logger.warn).toHaveBeenCalledWith(
      "Anh hoc vien van lon hon 40KB sau khi toi uu",
      {
        quality: 88,
        sizeKB: 52,
      }
    );
  });

  it("stops when a candidate reaches the 25-30KB target", async () => {
    const adapter = new FakeImageAdapter();
    const promoteCandidate = createPromoteMock();

    await expect(
      convertAndOptimizeStudentPhoto(inputPath, outputPath, {
        adapter,
        getFileSizeKB: createSizeMock([35, 28]),
        promoteCandidate,
        cleanupCandidate: createCleanupMock(),
      })
    ).resolves.toEqual({
      outputPath,
      quality: 85,
      sizeKB: 28,
      status: "target",
    });

    expect(adapter.calls.map((call) => call.quality)).toEqual([88, 85]);
    expect(promoteCandidate).toHaveBeenCalledWith(
      buildQualityCandidatePath(outputPath, 85),
      outputPath
    );
  });

  it("accepts the clearest candidate <=40KB when no target is reached", async () => {
    const adapter = new FakeImageAdapter();
    const promoteCandidate = createPromoteMock();

    await expect(
      convertAndOptimizeStudentPhoto(inputPath, outputPath, {
        adapter,
        getFileSizeKB: createSizeMock([38, 34, 32, 31]),
        promoteCandidate,
        cleanupCandidate: createCleanupMock(),
      })
    ).resolves.toEqual({
      outputPath,
      quality: 88,
      sizeKB: 38,
      status: "accepted",
    });

    expect(adapter.calls.map((call) => call.quality)).toEqual(qualityOrder);
    expect(promoteCandidate).toHaveBeenCalledWith(
      buildQualityCandidatePath(outputPath, 88),
      outputPath
    );
  });

  it("keeps the clearest candidate and warns when quality 78 is still over 40KB", async () => {
    const adapter = new FakeImageAdapter();
    const logger = {
      warn: vi.fn(),
    };
    const promoteCandidate = createPromoteMock();

    await expect(
      convertAndOptimizeStudentPhoto(inputPath, outputPath, {
        adapter,
        getFileSizeKB: createSizeMock([61, 55, 48, 43]),
        promoteCandidate,
        cleanupCandidate: createCleanupMock(),
        logger,
      })
    ).resolves.toEqual({
      outputPath,
      quality: 88,
      sizeKB: 61,
      status: "oversized",
      warning: "Anh hoc vien van lon hon 40KB sau khi toi uu",
    });

    expect(adapter.calls.map((call) => call.quality)).toEqual(qualityOrder);
    expect(promoteCandidate).toHaveBeenCalledWith(
      buildQualityCandidatePath(outputPath, 88),
      outputPath
    );
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain(inputPath);
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain("password");
  });

  it("uses ImageMagick commands without crop or distorted resize options", async () => {
    const runner = vi.fn<ImageCommandRunner>(async () => ({
      stdout: "",
      stderr: "",
    }));
    const adapter = new ImageMagickAdapter({ runner });

    await convertAndOptimizeStudentPhoto(inputPath, outputPath, {
      adapter,
      getFileSizeKB: createSizeMock([28]),
      promoteCandidate: createPromoteMock(),
      cleanupCandidate: createCleanupMock(),
    });

    const commandText = runner.mock.calls
      .flatMap(([command, args]) => [command, ...args])
      .join(" ");

    expect(commandText).toContain("magick");
    expect(commandText).toContain("-strip");
    expect(commandText).not.toContain("-crop");
    expect(commandText).not.toContain("-resize");
    expect(commandText).not.toContain("!");
  });

  it("gets file size in KB from a local temp file", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "sync-photo-size-"));
    tempRoots.push(tempRoot);
    const tempFilePath = path.join(tempRoot, "sample.bin");
    await writeFile(tempFilePath, Buffer.alloc(30 * 1024));

    await expect(getFileSizeKB(tempFilePath)).resolves.toBe(30);
  });
});

function createSizeMock(sizes: number[]) {
  const remainingSizes = [...sizes];

  return vi.fn(async () => {
    const size = remainingSizes.shift();

    if (size === undefined) {
      throw new Error("Missing mocked file size");
    }

    return size;
  });
}

function createPromoteMock() {
  return vi.fn(async (_candidatePath: string, _outputPath: string) => {
    // Mock copy/rename only; tests must not create JPG output in the repo.
  });
}

function createCleanupMock() {
  return vi.fn(async (_candidatePath: string) => {
    // Mock temp cleanup only; no image conversion runs in unit tests.
  });
}
