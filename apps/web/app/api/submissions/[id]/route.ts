import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../../lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
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
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const { id } = await params;
  const submissionId = Number(id);
  if (!Number.isInteger(submissionId) || submissionId < 1)
    return NextResponse.json(
      { error: "Invalid submission id" },
      { status: 400 },
    );
  const { data: submission, error: lookupError } = await supabase
    .from("submissions")
    .select("created_by, review_status")
    .eq("id", submissionId)
    .maybeSingle();
  if (lookupError || !submission)
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  const canDelete =
    profile?.role === "admin" ||
    (submission.created_by === user.id &&
      ["pending", "rejected"].includes(submission.review_status));
  if (!canDelete)
    return NextResponse.json({ error: "Submission deletion not allowed" }, { status: 403 });
  const { error } = await supabase
    .from("submissions")
    .delete()
    .eq("id", submissionId);
  if (error)
    return NextResponse.json(
      { error: "Unable to delete submission" },
      { status: 500 },
    );
  return NextResponse.json({ deleted: true });
}
