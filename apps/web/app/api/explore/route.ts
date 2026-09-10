import { NextResponse } from "next/server";
import { explore } from "../../../lib/supabase/dictionary";

export async function GET() {
  try {
    const concepts = await explore();
    if (concepts === null)
      return NextResponse.json(
        { error: "Supabase is not configured" },
        { status: 503 },
      );
    return NextResponse.json({ configured: true, concepts });
  } catch (error) {
    console.error("Explore lookup failed", error);
    return NextResponse.json({ error: "Explore lookup failed" }, { status: 500 });
  }
}