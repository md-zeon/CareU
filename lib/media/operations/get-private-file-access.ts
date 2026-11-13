import "server-only";
import { prisma } from "../../prisma.ts";
import { getActor } from "../../authz/actor.ts";
import { presignDownload } from "../r2.ts";
import { authorizePrivateRead } from "./auth.ts";

export type GetPrivateFileAccessInput = {
  assetId: string;
  purpose?: string; // access purpose/context
};

export type GetPrivateFileAccessResult =
  | {
      ok: true;
      data: {
        url: string;
        expiresAt: string;
        asset: {
          id: string;
          purpose: string;
          fileNameOriginal: string;
          mimeType: string;
          byteSize?: number;
        };
      };
    }
  | { ok: false; error: string; statusCode: number };

export async function getPrivateFileAccess(
  input: GetPrivateFileAccessInput,
): Promise<GetPrivateFileAccessResult> {
  const actor = await getActor();
  const accessPurpose = (input.purpose || "OWN_DOCUMENT_VIEW").toString();

  const authz = await authorizePrivateRead({
    assetId: input.assetId,
    accessPurpose,
    actor,
  });

  if (!authz.ok) {
    // Log denied (and anonymous denied attempts included). Best effort to log even if asset missing? spec says "every private file access attempt creates..." so log with available info.
    try {
      await prisma.privateFileAccessLog.create({
        data: {
          mediaAssetId: input.assetId, // may fail FK if asset missing; handle below
          actorType: authz.log.actorType,
          accessedByUserId: authz.log.accessedByUserId,
          purpose: accessPurpose,
          parentType: authz.log.parentType,
          parentId: authz.log.parentId,
          result: "DENIED",
          reason: authz.reason ?? (authz.status === 401 ? "UNAUTHENTICATED" : authz.status === 404 ? "NOT_FOUND" : "FORBIDDEN"),
        },
      });
    } catch {
      // If asset doesn't exist, FK prevents logging against it; we cannot create a valid log row without mediaAssetId.
      // Spec requires logging attempts - but schema requires mediaAssetId FK. In 404-missing-asset case, best we can do is not crash.
    }
    const statusCode = authz.status;
    return { ok: false, error: statusCode === 401 ? "UNAUTHENTICATED" : statusCode === 404 ? "NOT_FOUND" : "FORBIDDEN", statusCode };
  }

  const { asset } = authz;
  const signed = await presignDownload({
    visibility: "PRIVATE",
    key: asset.storageKey,
    fileName: asset.fileNameOriginal,
    inline: false,
  });

  // Log grant before returning URL (safe ordering).
  await prisma.privateFileAccessLog.create({
    data: {
      mediaAssetId: asset.id,
      actorType: authz.log.actorType,
      accessedByUserId: authz.log.accessedByUserId,
      actorRoleOrContext: authz.log.actorRoleOrContext ?? null,
      purpose: accessPurpose,
      parentType: authz.log.parentType,
      parentId: authz.log.parentId,
      grantedAt: new Date(),
      expiresAt: signed.expiresAt,
      result: "GRANTED",
    },
  });

  return {
    ok: true,
    data: {
      url: signed.url,
      expiresAt: signed.expiresAt.toISOString(),
      asset: {
        id: asset.id,
        purpose: asset.purpose,
        fileNameOriginal: asset.fileNameOriginal,
        mimeType: asset.mimeType,
      },
    },
  };
}
