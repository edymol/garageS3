import { NextResponse } from "next/server";
import { listBuckets, getBucketInfo, createBucket } from "@/lib/garage-admin";

export async function GET() {
  try {
    const buckets = await listBuckets();
    const detailed = await Promise.all(
      buckets.map((b) => getBucketInfo(b.id))
    );
    return NextResponse.json({ data: detailed });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch buckets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { alias } = await request.json();
    if (!alias || typeof alias !== "string") {
      return NextResponse.json({ error: "Bucket alias is required" }, { status: 400 });
    }
    const result = await createBucket(alias);
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create bucket" },
      { status: 500 }
    );
  }
}
