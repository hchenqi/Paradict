import { NextResponse } from "next/server";
import { search } from "@/lib/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { ...corsHeaders, ...init?.headers },
  });
}

function parseLanguages(value: string | null) {
  return (value?.split(",") ?? [])
    .map((code) => code.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 20);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const languages = parseLanguages(url.searchParams.get("languages"));
  const query = url.searchParams.get("q") ?? "";
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") ?? 24) || 24, 1),
    100,
  );
  if (!languages.length)
    return json({ error: "At least one language is required" }, { status: 400 });
  if (!query.trim())
    return json({ error: "A search query is required" }, { status: 400 });
  try {
    const concepts = await search(query, languages, limit);
    if (concepts === null)
      return json({ error: "Supabase is not configured" }, { status: 503 });
    return json({ configured: true, concepts });
  } catch (error) {
    console.error("Search failed", error);
    return json({ error: "Search failed" }, { status: 500 });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}