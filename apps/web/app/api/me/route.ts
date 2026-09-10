import { NextResponse } from "next/server";
import {
  getUserProfile,
  updateUserPreferences,
} from "../../../lib/supabase/dictionary";
import { getSupabaseServerClient } from "../../../lib/supabase/server";

export async function GET() {
  try {
    return NextResponse.json({ profile: await getUserProfile() });
  } catch (error) {
    console.error("Profile lookup failed", error);
    return NextResponse.json(
      { error: "Profile lookup failed" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      displayName?: unknown;
      username?: unknown;
      languageIds?: unknown;
    };
    const displayName =
      body.displayName === undefined || body.displayName === null
        ? body.displayName
        : String(body.displayName).trim();
    const username =
      body.username === undefined || body.username === null
        ? body.username
        : String(body.username).trim().toLowerCase();
    const languageIds =
      body.languageIds === undefined
        ? undefined
        : Array.isArray(body.languageIds) &&
            body.languageIds.length <= 20 &&
            body.languageIds.every((id) => Number.isInteger(id) && id > 0)
          ? [...new Set(body.languageIds as number[])]
          : null;
    if (
      languageIds === null ||
      (displayName !== undefined &&
        displayName !== null &&
        typeof displayName !== "string") ||
      (username !== undefined &&
        username !== null &&
        !/^[a-z0-9_]{6,30}$/.test(username))
    ) {
      return NextResponse.json(
        { error: "Invalid profile fields" },
        { status: 400 },
      );
    }
    const profile = await updateUserPreferences({
      displayName,
      username,
      languageIds,
    });
    if (profile === null) return NextResponse.json({ configured: false });
    if (profile === undefined)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile update failed", error);
    return NextResponse.json(
      { error: "Profile update failed" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ configured: false });
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError)
    return NextResponse.json(
      { error: "Unable to verify account" },
      { status: 401 },
    );
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    console.error("Account deletion failed", error);
    return NextResponse.json(
      { error: "Account deletion failed" },
      { status: 500 },
    );
  }
  await supabase.auth.signOut();
  return NextResponse.json({ deleted: true });
}
