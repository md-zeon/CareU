import { NextResponse } from "next/server";
import { getPrivateFileAccess } from "@/lib/media";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const input = body as { assetId?: string; purpose?: string };
  if (!input?.assetId) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const result = await getPrivateFileAccess({
    assetId: input.assetId,
    purpose: input.purpose,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode });
  }
  return NextResponse.json(result.data);
}
