import { NextResponse } from "next/server";
import { getLanguages } from "../../../lib/supabase/dictionary";

export async function GET() {
  const languages = await getLanguages();
  if (!languages)
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  return NextResponse.json({ configured: true, languages });
}
