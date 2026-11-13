import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getMediaConfig } from "./config.ts";

let client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (client) return client;
  const cfg = getMediaConfig();
  client = new S3Client({
    region: "auto",
    endpoint: cfg.r2Endpoint,
    credentials: {
      accessKeyId: cfg.r2AccessKeyId,
      secretAccessKey: cfg.r2SecretAccessKey,
    },
    forcePathStyle: true,
  });
  return client;
}

export function bucketForVisibility(visibility: "PUBLIC" | "PRIVATE"): string {
  const cfg = getMediaConfig();
  return visibility === "PUBLIC" ? cfg.bucketPublic : cfg.bucketPrivate;
}

export async function presignUpload(params: {
  visibility: "PUBLIC" | "PRIVATE";
  key: string;
  contentType: string;
  contentLength: number;
}): Promise<{ url: string; expiresAt: Date; headers: Record<string, string> }> {
  const cfg = getMediaConfig();
  const s3 = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucketForVisibility(params.visibility),
    Key: params.key,
    ContentType: params.contentType,
    ContentLength: params.contentLength,
  });
  const expiresIn = cfg.uploadUrlTtlSeconds;
  const url = await getSignedUrl(s3, command, { expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  // Callers should send these headers to satisfy the signed request.
  return {
    url,
    expiresAt,
    headers: {
      "Content-Type": params.contentType,
      "Content-Length": String(params.contentLength),
    },
  };
}

export async function presignDownload(params: {
  visibility: "PUBLIC" | "PRIVATE";
  key: string;
  fileName?: string;
  inline?: boolean;
}): Promise<{ url: string; expiresAt: Date }> {
  const cfg = getMediaConfig();
  const s3 = getR2Client();
  const dispositionName = params.fileName ? params.fileName.replace(/"/g, "'") : undefined;
  const contentDisposition = dispositionName
    ? `${params.inline ? "inline" : "attachment"}; filename="${dispositionName}"`
    : undefined;
  const command = new GetObjectCommand({
    Bucket: bucketForVisibility(params.visibility),
    Key: params.key,
    ...(contentDisposition ? { ResponseContentDisposition: contentDisposition } : {}),
  });
  const expiresIn = cfg.privateAccessUrlTtlSeconds;
  const url = await getSignedUrl(s3, command, { expiresIn });
  return { url, expiresAt: new Date(Date.now() + expiresIn * 1000) };
}

export async function headObject(params: {
  visibility: "PUBLIC" | "PRIVATE";
  key: string;
}): Promise<{
  contentLength?: number;
  contentType?: string;
  etag?: string;
} | null> {
  const s3 = getR2Client();
  try {
    const out = await s3.send(
      new HeadObjectCommand({
        Bucket: bucketForVisibility(params.visibility),
        Key: params.key,
      }),
    );
    return {
      contentLength: out.ContentLength,
      contentType: out.ContentType,
      etag: out.ETag ?? undefined,
    };
  } catch (e: unknown) {
    const name = typeof e === "object" && e && "name" in e ? String((e as { name?: unknown }).name) : "";
    const code = typeof e === "object" && e && "$metadata" in e ? (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode : undefined;
    if (name === "NotFound" || name === "NoSuchKey" || code === 404) return null;
    throw e;
  }
}

export async function deleteObject(params: {
  visibility: "PUBLIC" | "PRIVATE";
  key: string;
}): Promise<void> {
  const s3 = getR2Client();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucketForVisibility(params.visibility),
      Key: params.key,
    }),
  );
}

export function publicUrlForKey(storageKey: string): string {
  const cfg = getMediaConfig();
  return `${cfg.publicBaseUrl}/${storageKey}`;
}
