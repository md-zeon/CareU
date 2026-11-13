import "server-only";

function required(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw || !raw.trim()) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`Invalid ${name}: must be a positive integer`);
  }
  return n;
}

export type MediaConfig = {
  r2Endpoint: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  bucketPublic: string;
  bucketPrivate: string;
  publicBaseUrl: string;
  uploadUrlTtlSeconds: number;
  privateAccessUrlTtlSeconds: number;
};

let cached: MediaConfig | null = null;

export function getMediaConfig(): MediaConfig {
  if (cached) return cached;
  cached = {
    r2Endpoint: required("R2_ENDPOINT"),
    r2AccessKeyId: required("R2_ACCESS_KEY_ID"),
    r2SecretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    bucketPublic: required("R2_BUCKET_PUBLIC"),
    bucketPrivate: required("R2_BUCKET_PRIVATE"),
    publicBaseUrl: required("R2_PUBLIC_BASE_URL").replace(/\/+$/, ""),
    uploadUrlTtlSeconds: intFromEnv("MEDIA_UPLOAD_URL_TTL_SECONDS", 600),
    privateAccessUrlTtlSeconds: intFromEnv("MEDIA_PRIVATE_ACCESS_URL_TTL_SECONDS", 300),
  };
  return cached;
}

export function getMediaConfigOptional(): MediaConfig | null {
  try {
    return getMediaConfig();
  } catch {
    return null;
  }
}
