import { NextResponse } from "next/server";
import { updateMediaMetadata } from "@/lib/media";
import type { UpdateMediaMetadataInput } from "@/lib/media/operations/update-media";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const result = await updateMediaMetadata(body as UpdateMediaMetadataInput);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode });
  }
  return NextResponse.json(result.data);
}
