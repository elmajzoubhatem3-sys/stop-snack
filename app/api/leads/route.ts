import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

export async function GET() {
  try {
    const leads = await sql`
      SELECT id, name, phone, created_at
      FROM customer_leads
      ORDER BY created_at DESC
    `;

    return NextResponse.json(leads);
  } catch (error) {
    console.error("GET /api/leads error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = body?.name?.trim();
    const phone = body?.phone?.trim();

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    const inserted = await sql`
      INSERT INTO customer_leads (name, phone)
      VALUES (${name}, ${phone})
      RETURNING *
    `;

    return NextResponse.json(inserted[0]);
  } catch (error) {
    console.error("POST /api/leads error:", error);
    return NextResponse.json(
      { error: "Failed to save lead" },
      { status: 500 }
    );
  }
}