import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getS3Client } from "@/lib/garage-s3";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bucket: string }> }
) {
  try {
    const { bucket } = await params;
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix") || "";
    const delimiter = "/";

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: delimiter,
    });

    const response = await getS3Client().send(command);

    const folders = (response.CommonPrefixes || []).map((p) => ({
      key: p.Prefix!,
      size: 0,
      lastModified: "",
      isFolder: true,
    }));

    const files = (response.Contents || [])
      .filter((obj) => obj.Key !== prefix)
      .map((obj) => ({
        key: obj.Key!,
        size: obj.Size || 0,
        lastModified: obj.LastModified?.toISOString() || "",
        isFolder: false,
      }));

    return NextResponse.json({ data: [...folders, ...files] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list objects" },
      { status: 500 }
    );
  }
}
