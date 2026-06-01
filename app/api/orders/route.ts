import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

type OrderItem = {
  product_id: number | string;
  product_name: string;
  quantity: number;
  price_lbp: number;
};

export async function GET() {
  try {
    const orders = await sql`
      SELECT *
      FROM orders
      ORDER BY created_at DESC
    `;

    const items = await sql`
      SELECT *
      FROM order_items
      ORDER BY id ASC
    `;

    return NextResponse.json({ orders, items });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const customer_name = body?.customer_name?.trim() || "";
    const customer_phone = body?.customer_phone?.trim() || "";
    const table_number = body?.table_number?.trim() || "";
    const notes = body?.notes?.trim() || "";
    const items: OrderItem[] = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    const total_lbp = items.reduce(
      (sum, item) => sum + Number(item.price_lbp) * Number(item.quantity),
      0
    );

    const insertedOrder = await sql`
      INSERT INTO orders
      (customer_name, customer_phone, table_number, notes, total_lbp)
      VALUES
      (${customer_name}, ${customer_phone}, ${table_number}, ${notes}, ${total_lbp})
      RETURNING *
    `;

    const order = insertedOrder[0];

    await Promise.all(
      items.map((item) =>
        sql`
          INSERT INTO order_items
          (order_id, product_id, product_name, quantity, price_lbp)
          VALUES
          (
            ${Number(order.id)},
            ${Number(item.product_id)},
            ${item.product_name},
            ${Number(item.quantity)},
            ${Number(item.price_lbp)}
          )
        `
      )
    );

    return NextResponse.json(order);
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}