import { NextResponse } from "next/server";
import { createUploadIntent } from "@/lib/media";
import type { CreateUploadIntentInput } from "@/lib/media/operations/create-upload-intent";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const result = await createUploadIntent(body as CreateUploadIntentInput);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode });
  }
  return NextResponse.json(result.data, { status: 201 });
}
