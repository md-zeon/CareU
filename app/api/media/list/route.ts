import { NextResponse } from "next/server";
import { listMediaForParent } from "@/lib/media";
import type { ListMediaForParentInput } from "@/lib/media/operations/list-media";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const result = await listMediaForParent(body as ListMediaForParentInput);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode });
  }
  return NextResponse.json({ items: result.data });
}
