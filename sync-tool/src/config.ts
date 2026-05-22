export type SyncToolRuntimeEnv = {
  NODE_ENV?: string;
};

export class SyncToolConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncToolConfigError";
  }
}

export function normalizeApiUrlForSync(
  apiUrl: string | undefined,
  env: SyncToolRuntimeEnv = process.env
): string {
  const normalized = apiUrl?.trim();

  if (!normalized) {
    throw new SyncToolConfigError("API_URL is required");
  }

  const parsed = parseApiUrl(normalized);

  if (!isHttpProtocol(parsed.protocol)) {
    throw new SyncToolConfigError("API_URL must use http or https");
  }

  if (
    env.NODE_ENV === "production" &&
    parsed.protocol === "http:" &&
    !isLocalHttpHost(parsed.hostname)
  ) {
    throw new SyncToolConfigError(
      "Production sync API_URL must use HTTPS unless it points to localhost"
    );
  }

  return normalized.replace(/\/+$/, "");
}

function parseApiUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new SyncToolConfigError("API_URL is invalid");
  }
}

function isHttpProtocol(protocol: string): boolean {
  return protocol === "http:" || protocol === "https:";
}

function isLocalHttpHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}
