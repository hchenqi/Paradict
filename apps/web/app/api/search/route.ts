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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const languages = url.searchParams.get("lang")?.split(",") ?? [];
  const limit = Number(url.searchParams.get("limit"));
  if (!query.trim() || !languages.length || languages.length > 20 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    return json(await search(query, languages, limit));
  } catch (error) {
    return json({ error: "Search failed" }, { status: 500 });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
