import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();

  const status = body?.status || "new";

  await sql`
    UPDATE orders
    SET status = ${status}
    WHERE id = ${Number(id)}
  `;

  return NextResponse.json({ success: true });
}