import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

export async function GET() {
  try {
    const products = await sql`
      SELECT
        products.id,
        products.name,
        products.name_en,
        products.description,
        products.description_en,
        products.price_lbp,
        products.image_url,
        products.category_id,
        products.sort_order,
        categories.name AS category_name,
        categories.name_en AS category_name_en
      FROM products
      LEFT JOIN categories ON categories.id = products.category_id
      ORDER BY categories.sort_order ASC, products.sort_order ASC, products.id ASC
    `;

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch products",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const category_id = Number(body?.category_id);
    const name = body?.name?.trim();
    const name_en = body?.name_en?.trim() || "";
    const description = body?.description?.trim() || "";
    const description_en = body?.description_en?.trim() || "";
    const price_lbp = Number(body?.price_lbp);
    const image_url = body?.image_url?.trim() || "";
    const sort_order = Number(body?.sort_order ?? 0);

    if (!category_id || !name || !price_lbp) {
      return NextResponse.json(
        { error: "category_id, Arabic name, and price_lbp are required" },
        { status: 400 }
      );
    }

    const inserted = await sql`
      INSERT INTO products
      (category_id, name, name_en, description, description_en, price_lbp, image_url, sort_order)
      VALUES
      (${category_id}, ${name}, ${name_en}, ${description}, ${description_en}, ${price_lbp}, ${image_url}, ${sort_order})
      RETURNING *
    `;

    return NextResponse.json(inserted[0]);
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      {
        error: "Failed to create product",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}