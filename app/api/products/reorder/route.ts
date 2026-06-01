import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

type ReorderItem = {
  id: number | string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items: ReorderItem[] = Array.isArray(body.items) ? body.items : [];

    await Promise.all(
      items.map((item: ReorderItem, index: number) =>
        sql`
          UPDATE products
          SET sort_order = ${index}
          WHERE id = ${Number(item.id)}
        `
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder products error:", error);
    return NextResponse.json(
      { error: "Failed to reorder products" },
      { status: 500 }
    );
  }
}