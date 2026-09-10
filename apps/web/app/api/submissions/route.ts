import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase)
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(
    24,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? 10) || 10),
  );
  const status = url.searchParams.get("status") === "pending" ? "pending" : null;
  const from = (page - 1) * pageSize;
  let query = supabase
    .from("submissions")
    .select(
      "id, created_by, payload, review_status, review_note, created_at, users!submissions_created_by_fkey(username)",
      { count: "exact" },
    )
    .order("created_at", { ascending: true })
    .range(from, from + pageSize - 1);
  query = query.eq("review_status", status ?? "pending");
  const { data, error, count } = await query;
  if (error) {
    console.error("Submission lookup failed", error);
    return NextResponse.json(
      { error: "Submission lookup failed" },
      { status: 500 },
    );
  }
  return NextResponse.json({
    submissions: data ?? [],
    page,
    pageSize,
    total: count ?? 0,
  });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase)
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    payload?: unknown;
  };
  if (
    !body.payload ||
    typeof body.payload !== "object" ||
    Array.isArray(body.payload)
  ) {
    return NextResponse.json(
      { error: "A valid payload is required" },
      { status: 400 },
    );
  }
  const { data, error } = await supabase
    .from("submissions")
    .insert({
      created_by: user.id,
      payload: body.payload,
    })
    .select("id, created_by, payload, review_status, created_at")
    .single();
  if (error) {
    console.error("Submission creation failed", error);
    return NextResponse.json(
      { error: "Submission creation failed" },
      { status: 500 },
    );
  }
  return NextResponse.json({ submission: data }, { status: 201 });
}
