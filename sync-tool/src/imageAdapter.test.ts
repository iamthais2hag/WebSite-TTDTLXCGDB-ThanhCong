import { describe, expect, it, vi, type MockedFunction } from "vitest";
import {
  ImageMagickAdapter,
  ImageProcessingError,
  type ImageCommandRunner,
} from "./imageAdapter.js";

const inputJp2 = "C:\\temp\\source.jp2";
const inputJpg = "C:\\temp\\source.jpg";
const outputJpg = "C:\\temp\\optimized.jpg";

function createRunnerMock(): MockedFunction<ImageCommandRunner> {
  return vi.fn<ImageCommandRunner>(async () => ({
    stdout: "",
    stderr: "",
  }));
}

describe("image processing adapter", () => {
  it("checkEngineAvailable returns true when magick -version succeeds", async () => {
    const runner = createRunnerMock();
    const adapter = new ImageMagickAdapter({ runner });

    await expect(adapter.checkEngineAvailable()).resolves.toBe(true);

    expect(runner).toHaveBeenCalledWith("magick", ["-version"]);
  });

  it("checkEngineAvailable returns false when magick is unavailable", async () => {
    const runner = vi.fn<ImageCommandRunner>(async () => {
      throw new Error("command not found");
    });
    const adapter = new ImageMagickAdapter({ runner });

    await expect(adapter.checkEngineAvailable()).resolves.toBe(false);
  });

  it("convertJp2ToJpg calls magick with input and output paths", async () => {
    const runner = createRunnerMock();
    const adapter = new ImageMagickAdapter({ runner });

    await expect(
      adapter.convertJp2ToJpg(inputJp2, outputJpg)
    ).resolves.toEqual({
      outputPath: outputJpg,
    });

    expect(runner).toHaveBeenCalledWith("magick", [
      inputJp2,
      "-auto-orient",
      "-strip",
      "-quality",
      "88",
      outputJpg,
    ]);
  });

  it("optimizeJpg calls magick with configured quality", async () => {
    const runner = createRunnerMock();
    const adapter = new ImageMagickAdapter({ runner });

    await expect(
      adapter.optimizeJpg(inputJpg, outputJpg, { quality: 85 })
    ).resolves.toEqual({
      outputPath: outputJpg,
    });

    expect(runner).toHaveBeenCalledWith("magick", [
      inputJpg,
      "-auto-orient",
      "-strip",
      "-quality",
      "85",
      outputJpg,
    ]);
  });

  it("throws controlled error when conversion command fails", async () => {
    const runner = vi.fn<ImageCommandRunner>(async () => {
      throw new Error("magick failed with local path detail");
    });
    const adapter = new ImageMagickAdapter({ runner });

    await expect(adapter.convertJp2ToJpg(inputJp2, outputJpg)).rejects.toThrow(
      ImageProcessingError
    );
    await expect(adapter.convertJp2ToJpg(inputJp2, outputJpg)).rejects.toThrow(
      "ImageMagick command failed"
    );
  });

  it("does not put secrets in the generated command arguments", async () => {
    const runner = createRunnerMock();
    const adapter = new ImageMagickAdapter({ runner });
    const secret = "test-sync-secret";

    await adapter.convertJp2ToJpg(inputJp2, outputJpg);

    const commandText = runner.mock.calls
      .flatMap(([command, args]) => [command, ...args])
      .join(" ");

    expect(commandText).not.toContain(secret);
    expect(commandText).not.toContain("password");
  });
});
