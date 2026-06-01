import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const name = body?.name?.trim();
    const name_en = body?.name_en?.trim() || "";
    const sort_order = Number(body?.sort_order ?? 0);

    if (!name) {
      return NextResponse.json({ error: "Arabic category name is required" }, { status: 400 });
    }

    const updated = await sql`
      UPDATE categories
      SET name = ${name}, name_en = ${name_en}, sort_order = ${sort_order}
      WHERE id = ${Number(id)}
      RETURNING *
    `;

    return NextResponse.json(updated[0] || null);
  } catch (error) {
    console.error("PATCH /api/categories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update category", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const products = await sql`
      SELECT id FROM products
      WHERE category_id = ${Number(id)}
      LIMIT 1
    `;

    if (products.length > 0) {
      return NextResponse.json(
        { error: "Delete products inside this category first" },
        { status: 400 }
      );
    }

    await sql`
      DELETE FROM categories
      WHERE id = ${Number(id)}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete category", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}