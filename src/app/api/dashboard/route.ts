import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getClusterStatus, listBuckets, listKeys, getBucketInfo } from "@/lib/garage-admin";
import { getS3Client } from "@/lib/garage-s3";

export async function GET() {
  try {
    const [clusterStatus, buckets, keys] = await Promise.all([
      getClusterStatus(),
      listBuckets(),
      listKeys(),
    ]);

    const bucketDetails = await Promise.all(
      buckets.map((b) => getBucketInfo(b.id))
    );

    const storageUsed = bucketDetails.reduce((sum, b) => sum + b.bytes, 0);
    const node = clusterStatus.nodes[0];
    const storageTotal = node?.dataPartition?.total || 0;
    const allUp = clusterStatus.nodes.every((n) => n.isUp);

    // Gather recent uploads across all buckets (latest 10)
    const recentUploads: { key: string; bucket: string; size: number; lastModified: string }[] = [];

    for (const bucket of buckets) {
      const alias = bucket.globalAliases[0] || bucket.id;
      try {
        const response = await getS3Client().send(
          new ListObjectsV2Command({ Bucket: alias, MaxKeys: 20 })
        );
        for (const obj of response.Contents || []) {
          recentUploads.push({
            key: obj.Key!,
            bucket: alias,
            size: obj.Size || 0,
            lastModified: obj.LastModified?.toISOString() || "",
          });
        }
      } catch {
        // Skip buckets we can't list with current S3 key
      }
    }

    recentUploads.sort(
      (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );

    return NextResponse.json({
      data: {
        bucketCount: buckets.length,
        keyCount: keys.length,
        storageUsed,
        storageTotal,
        nodeStatus: allUp ? "healthy" : "degraded",
        recentUploads: recentUploads.slice(0, 10),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
