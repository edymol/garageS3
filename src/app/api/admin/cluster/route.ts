import { NextResponse } from "next/server";
import { getClusterStatus, getClusterLayout } from "@/lib/garage-admin";

export async function GET() {
  try {
    const [status, layout] = await Promise.all([
      getClusterStatus(),
      getClusterLayout(),
    ]);
    return NextResponse.json({ data: { status, layout } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch cluster info" },
      { status: 500 }
    );
  }
}
