import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../../../lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const supabase = await getSupabaseServerClient();
  if (!supabase)
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: actor } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (actor?.role !== "admin")
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  const body = (await request.json()) as { role?: unknown };
  if (!["member", "editor", "admin"].includes(String(body.role)))
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  const { username } = await params;
  const { data: target } = await supabase
    .from("users")
    .select("id")
    .eq("username", username.toLowerCase())
    .single();
  if (!target)
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  const { error } = await supabase.rpc("update_user_role", {
    user_id: target.id,
    user_role: body.role,
  });
  if (error)
    return NextResponse.json(
      { error: "Unable to update role" },
      { status: 500 },
    );
  return NextResponse.json({ profile: { username, role: body.role } });
}
