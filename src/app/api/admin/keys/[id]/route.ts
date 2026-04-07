import { NextResponse } from "next/server";
import { deleteKey } from "@/lib/garage-admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteKey(id);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete key" },
      { status: 500 }
    );
  }
}
