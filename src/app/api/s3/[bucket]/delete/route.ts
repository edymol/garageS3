import { NextResponse } from "next/server";
import { DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getS3Client } from "@/lib/garage-s3";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bucket: string }> }
) {
  try {
    const { bucket } = await params;
    const { keys } = await request.json();

    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: "No keys provided" }, { status: 400 });
    }

    if (keys.length === 1) {
      await getS3Client().send(
        new DeleteObjectCommand({ Bucket: bucket, Key: keys[0] })
      );
    } else {
      await getS3Client().send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: keys.map((k: string) => ({ Key: k })) },
        })
      );
    }

    return NextResponse.json({ data: { deleted: keys.length } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete objects" },
      { status: 500 }
    );
  }
}
