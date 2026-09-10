import { NextResponse } from "next/server";
import type { LanguageCode } from "../../../../lib/dictionary";
import { getConceptFromSupabase } from "../../../../lib/supabase/dictionary";

function parseLanguages(value: string | null): LanguageCode[] {
  return (value?.split(",") ?? [])
    .filter((code): code is LanguageCode => Boolean(code))
    .slice(0, 20);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const conceptId = Number((await params).id);
  if (!Number.isInteger(conceptId) || conceptId < 1)
    return NextResponse.json({ error: "Invalid concept id" }, { status: 400 });

  try {
    const concept = await getConceptFromSupabase(
      conceptId,
      parseLanguages(new URL(request.url).searchParams.get("languages")),
    );
    if (concept === null)
      return NextResponse.json(
        { error: "Supabase is not configured" },
        { status: 503 },
      );
    if (concept === undefined)
      return NextResponse.json({ error: "Concept not found" }, { status: 404 });
    return NextResponse.json({ configured: true, concept });
  } catch (error) {
    console.error("Concept lookup failed", error);
    return NextResponse.json(
      { error: "Concept lookup failed" },
      { status: 500 },
    );
  }
}
