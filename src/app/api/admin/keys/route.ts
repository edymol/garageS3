import { NextResponse } from "next/server";
import { listKeys, getKeyInfo, createKey } from "@/lib/garage-admin";

export async function GET() {
  try {
    const keys = await listKeys();
    const detailed = await Promise.all(
      keys.map((k) => getKeyInfo(k.id))
    );
    return NextResponse.json({ data: detailed });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch keys" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Key name is required" }, { status: 400 });
    }
    const result = await createKey(name);
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create key" },
      { status: 500 }
    );
  }
}
