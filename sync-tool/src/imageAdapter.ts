import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const defaultImageMagickCommand = "magick";
const defaultJpegQuality = 88;

export type ImageCommandResult = {
  stdout?: string;
  stderr?: string;
};

export type ImageCommandRunner = (
  command: string,
  args: string[]
) => Promise<ImageCommandResult>;

export type ImageProcessingOptions = {
  quality?: number;
};

export type ImageProcessingResult = {
  outputPath: string;
};

export type ImageProcessingAdapter = {
  checkEngineAvailable(): Promise<boolean>;
  convertJp2ToJpg(
    inputPath: string,
    outputPath: string,
    options?: ImageProcessingOptions
  ): Promise<ImageProcessingResult>;
  optimizeJpg(
    inputPath: string,
    outputPath: string,
    options?: ImageProcessingOptions
  ): Promise<ImageProcessingResult>;
};

export type ImageMagickAdapterOptions = {
  command?: string;
  runner?: ImageCommandRunner;
};

export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

export class ImageMagickAdapter implements ImageProcessingAdapter {
  private readonly command: string;
  private readonly runner: ImageCommandRunner;

  constructor(options: ImageMagickAdapterOptions = {}) {
    this.command = options.command ?? defaultImageMagickCommand;
    this.runner = options.runner ?? runImageCommand;
  }

  async checkEngineAvailable(): Promise<boolean> {
    try {
      await this.runner(this.command, ["-version"]);
      return true;
    } catch {
      return false;
    }
  }

  async convertJp2ToJpg(
    inputPath: string,
    outputPath: string,
    options: ImageProcessingOptions = {}
  ): Promise<ImageProcessingResult> {
    await this.runMagick(buildJpegArgs(inputPath, outputPath, options));

    return {
      outputPath,
    };
  }

  async optimizeJpg(
    inputPath: string,
    outputPath: string,
    options: ImageProcessingOptions = {}
  ): Promise<ImageProcessingResult> {
    await this.runMagick(buildJpegArgs(inputPath, outputPath, options));

    return {
      outputPath,
    };
  }

  private async runMagick(args: string[]): Promise<void> {
    try {
      await this.runner(this.command, args);
    } catch {
      throw new ImageProcessingError("ImageMagick command failed");
    }
  }
}

export function createImageProcessingAdapter(
  options: ImageMagickAdapterOptions = {}
): ImageProcessingAdapter {
  return new ImageMagickAdapter(options);
}

function buildJpegArgs(
  inputPath: string,
  outputPath: string,
  options: ImageProcessingOptions
): string[] {
  assertImagePath(inputPath, "inputPath");
  assertImagePath(outputPath, "outputPath");

  return [
    inputPath,
    "-auto-orient",
    "-strip",
    "-quality",
    String(resolveJpegQuality(options.quality)),
    outputPath,
  ];
}

function assertImagePath(value: string, fieldName: string): void {
  if (value.trim().length === 0) {
    throw new ImageProcessingError(`${fieldName} is required`);
  }
}

function resolveJpegQuality(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return defaultJpegQuality;
  }

  if (value < 1 || value > 100) {
    return defaultJpegQuality;
  }

  return value;
}

async function runImageCommand(
  command: string,
  args: string[]
): Promise<ImageCommandResult> {
  const result = await execFileAsync(command, args, {
    windowsHide: true,
  });

  return {
    stdout: String(result.stdout ?? ""),
    stderr: String(result.stderr ?? ""),
  };
}
