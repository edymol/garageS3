import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client } from "@/lib/garage-s3";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bucket: string; key: string[] }> }
) {
  try {
    const { bucket, key } = await params;
    const objectKey = key.join("/");

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    });

    const response = await getS3Client().send(command);
    const bytes = await response.Body?.transformToByteArray();

    if (!bytes) {
      return NextResponse.json({ error: "Empty response" }, { status: 404 });
    }

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": response.ContentType || "application/octet-stream",
        "Content-Length": String(bytes.length),
        "Content-Disposition": `attachment; filename="${objectKey.split("/").pop()}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to download file" },
      { status: 500 }
    );
  }
}
