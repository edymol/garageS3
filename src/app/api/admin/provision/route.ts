import { NextResponse } from "next/server";
import { createBucket, createKey, allowBucketKey } from "@/lib/garage-admin";

export async function POST(request: Request) {
  try {
    const { bucketAlias, keyName } = await request.json();

    if (!bucketAlias || typeof bucketAlias !== "string") {
      return NextResponse.json({ error: "Bucket name is required" }, { status: 400 });
    }
    if (!keyName || typeof keyName !== "string") {
      return NextResponse.json({ error: "Key name is required" }, { status: 400 });
    }

    // Step 1: Create bucket
    const bucket = await createBucket(bucketAlias);

    // Step 2: Create key
    const key = await createKey(keyName);

    // Step 3: Assign owner permissions
    await allowBucketKey(bucket.id, key.accessKeyId, {
      read: true,
      write: true,
      owner: true,
    });

    return NextResponse.json({
      data: {
        bucket: { id: bucket.id, alias: bucketAlias },
        key: {
          accessKeyId: key.accessKeyId,
          secretAccessKey: key.secretAccessKey,
          name: key.name,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to provision bucket" },
      { status: 500 }
    );
  }
}
