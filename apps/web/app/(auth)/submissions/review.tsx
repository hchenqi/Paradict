import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../../../lib/supabase/server";

async function isEditor(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
  userId: string,
) {
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role === "editor" || data?.role === "admin";
}

export async function POST(
  request: Request,
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
  if (!user || !(await isEditor(supabase, user.id)))
    return NextResponse.json(
      { error: "Editor access required" },
      { status: 403 },
    );
  const { id } = await params;
  const submissionId = Number(id);
  const body = (await request.json()) as { action?: unknown; note?: unknown };
  if (
    !Number.isInteger(submissionId) ||
    !["approve", "reject"].includes(String(body.action))
  )
    return NextResponse.json(
      { error: "Invalid review request" },
      { status: 400 },
    );
  const { data: submission, error: loadError } = await supabase
    .from("submissions")
    .select("id, payload, review_status")
    .eq("id", submissionId)
    .single();
  if (loadError || !submission)
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  if (submission.review_status !== "pending")
    return NextResponse.json(
      { error: "Only pending submissions can be reviewed" },
      { status: 409 },
    );
  if (body.action === "reject") {
    const { error } = await supabase
      .from("submissions")
      .update({
        review_status: "rejected",
        review_note:
          typeof body.note === "string" ? body.note.slice(0, 300) : null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submissionId);
    if (error)
      return NextResponse.json(
        { error: "Unable to reject submission" },
        { status: 500 },
      );
    return NextResponse.json({ status: "rejected" });
  }

  const payload = submission.payload as Record<string, unknown>;
  try {
    if (payload.entries && typeof payload.entries === "object") {
      const { data: concept, error: conceptError } = await supabase
        .from("concepts")
        .insert({})
        .select("id")
        .single();
      if (conceptError || !concept)
        throw conceptError ?? new Error("Concept creation failed");
      const entries = [] as Array<{
        concept_id: number;
        language_id: number;
        expression: string;
      }>;
      const groups = (payload.entries ?? {}) as Record<string, unknown>;
      for (const [code, words] of Object.entries(groups)) {
        const { data: language } = await supabase
          .from("languages")
          .select("id")
          .eq("iso_code", code)
          .single();
        if (!language || !Array.isArray(words)) continue;
        for (const word of words)
          if (typeof word === "string" && word.trim())
            entries.push({
              concept_id: concept.id,
              language_id: language.id,
              expression: word.trim(),
            });
      }
      if (!entries.length) throw new Error("No valid entries");
      const { error } = await supabase.from("entries").insert(entries);
      if (error) throw error;
    } else if (payload.concept_id && (payload.added || payload.updated || payload.deleted)) {
      const conceptId = Number(payload.concept_id);
      const added = (payload.added ?? {}) as Record<string, unknown>;
      for (const [code, words] of Object.entries(added)) {
        const { data: language } = await supabase
          .from("languages")
          .select("id")
          .eq("iso_code", code)
          .single();
        if (language && Array.isArray(words))
          await supabase
            .from("entries")
            .insert(
              words
                .filter(
                  (word): word is string =>
                    typeof word === "string" && Boolean(word.trim()),
                )
                .map((expression) => ({
                  concept_id: conceptId,
                  language_id: language.id,
                  expression: expression.trim(),
                })),
            );
      }
      for (const item of (payload.updated ?? []) as Array<{
        entry_id?: number;
        expression?: string;
      }>)
        if (item.entry_id && item.expression?.trim())
          await supabase
            .from("entries")
            .update({ expression: item.expression.trim() })
            .eq("id", item.entry_id)
            .eq("concept_id", conceptId);
      for (const entryId of (payload.deleted ?? []) as unknown[])
        if (Number.isInteger(entryId))
          await supabase
            .from("entries")
            .delete()
            .eq("id", entryId)
            .eq("concept_id", conceptId);
    } else if (payload.keep_id && payload.duplicate_id) {
      const keepId = Number(payload.keep_id);
      const duplicateId = Number(payload.duplicate_id);
      const { data: entries } = await supabase
        .from("entries")
        .select("id, language_id, expression")
        .eq("concept_id", duplicateId);
      for (const entry of entries ?? []) {
        const { error } = await supabase
          .from("entries")
          .update({ concept_id: keepId })
          .eq("id", entry.id);
        if (error) throw error;
      }
    }
    const { error } = await supabase
      .from("submissions")
      .update({
        review_status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submissionId);
    if (error) throw error;
    return NextResponse.json({ status: "approved" });
  } catch (error) {
    console.error("Submission approval failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to approve submission",
      },
      { status: 400 },
    );
  }
}
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
