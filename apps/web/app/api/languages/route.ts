import { NextResponse } from "next/server";
import { getLanguageList } from "@/lib/server";

export async function GET() {
  const languages = await getLanguageList();
  if (!languages)
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  return NextResponse.json({ configured: true, languages });
}
