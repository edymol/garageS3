import { NextResponse } from "next/server";
import { allowBucketKey, denyBucketKey } from "@/lib/garage-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accessKeyId } = await params;
    const { bucketId, permissions, action } = await request.json();

    if (!bucketId || !permissions || !action) {
      return NextResponse.json(
        { error: "bucketId, permissions, and action are required" },
        { status: 400 }
      );
    }

    if (action === "allow") {
      await allowBucketKey(bucketId, accessKeyId, permissions);
    } else if (action === "deny") {
      await denyBucketKey(bucketId, accessKeyId, permissions);
    } else {
      return NextResponse.json({ error: "action must be 'allow' or 'deny'" }, { status: 400 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update permissions" },
      { status: 500 }
    );
  }
}
