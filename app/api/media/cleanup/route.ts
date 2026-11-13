import { NextResponse } from "next/server";
import { cleanupStoredObject } from "@/lib/media";
import type { CleanupStoredObjectInput } from "@/lib/media/operations/cleanup";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const input = body as Partial<CleanupStoredObjectInput>;
  if (!input?.assetId) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const result = await cleanupStoredObject(input as CleanupStoredObjectInput);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode });
  }
  return NextResponse.json(result.data);
}
