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
    const description = body?.description?.trim() || "";
    const description_en = body?.description_en?.trim() || "";
    const price_lbp = Number(body?.price_lbp);
    const category_id = Number(body?.category_id);
    const sort_order = Number(body?.sort_order ?? 0);
    const image_url = body?.image_url;

    if (!name || !price_lbp || !category_id) {
      return NextResponse.json(
        { error: "Arabic name, price_lbp, and category_id are required" },
        { status: 400 }
      );
    }

    if (typeof image_url === "string") {
      const updated = await sql`
        UPDATE products
        SET
          name = ${name},
          name_en = ${name_en},
          description = ${description},
          description_en = ${description_en},
          price_lbp = ${price_lbp},
          category_id = ${category_id},
          sort_order = ${sort_order},
          image_url = ${image_url}
        WHERE id = ${Number(id)}
        RETURNING *
      `;

      return NextResponse.json(updated[0] || null);
    }

    const updated = await sql`
      UPDATE products
      SET
        name = ${name},
        name_en = ${name_en},
        description = ${description},
        description_en = ${description_en},
        price_lbp = ${price_lbp},
        category_id = ${category_id},
        sort_order = ${sort_order}
      WHERE id = ${Number(id)}
      RETURNING *
    `;

    return NextResponse.json(updated[0] || null);
  } catch (error) {
    console.error("PATCH /api/products/[id] error:", error);
    return NextResponse.json(
      {
        error: "Failed to update product",
        details: error instanceof Error ? error.message : String(error),
      },
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

    await sql`
      DELETE FROM products
      WHERE id = ${Number(id)}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete product",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}