import { NextResponse } from "next/server";
import { removeOrReplaceMedia } from "@/lib/media";
import type { RemoveOrReplaceInput } from "@/lib/media/operations/remove-or-replace";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const input = body as Partial<RemoveOrReplaceInput>;
  if (!input?.assetId) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const result = await removeOrReplaceMedia(input as RemoveOrReplaceInput);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode });
  }
  return NextResponse.json(result.data);
}
