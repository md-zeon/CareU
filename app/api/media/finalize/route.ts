import { NextResponse } from "next/server";
import { finalizeUpload } from "@/lib/media";
import type { FinalizeUploadInput } from "@/lib/media/operations/finalize-upload";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const input = body as Partial<FinalizeUploadInput>;
  if (!input?.assetId) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const result = await finalizeUpload(input as FinalizeUploadInput);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode });
  }
  return NextResponse.json(result.data);
}
