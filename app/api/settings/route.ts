import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM settings
      WHERE id = 1
      LIMIT 1
    `;

    return NextResponse.json(rows[0] || null);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch settings",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const header_type = body?.header_type === "banner" ? "banner" : "text";
    const header_title = body?.header_title?.trim() || "Stop Snack";
    const header_subtitle = body?.header_subtitle?.trim() || "";
    const header_subtitle_en = body?.header_subtitle_en?.trim() || "";
    const header_banner_url = body?.header_banner_url?.trim() || "";
    const header_banner_urls = body?.header_banner_urls?.trim() || "";

    const offers_enabled =
      typeof body?.offers_enabled === "boolean" ? body.offers_enabled : true;

    const offers_text = body?.offers_text?.trim() || "استفد من عروضاتنا";
    const offers_text_en = body?.offers_text_en?.trim() || "Get our latest offers";

    const ordering_enabled =
      typeof body?.ordering_enabled === "boolean"
        ? body.ordering_enabled
        : false;

    const updated = await sql`
      UPDATE settings
      SET
        header_type = ${header_type},
        header_title = ${header_title},
        header_subtitle = ${header_subtitle},
        header_subtitle_en = ${header_subtitle_en},
        header_banner_url = ${header_banner_url},
        header_banner_urls = ${header_banner_urls},
        offers_enabled = ${offers_enabled},
        offers_text = ${offers_text},
        offers_text_en = ${offers_text_en},
        ordering_enabled = ${ordering_enabled}
      WHERE id = 1
      RETURNING *
    `;

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("PATCH /api/settings error:", error);
    return NextResponse.json(
      {
        error: "Failed to update settings",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}