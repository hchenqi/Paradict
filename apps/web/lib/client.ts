"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types";
import { Entry } from "./types";

export const supabase = createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);

export async function getConceptEntries(id: number) {
  const { data, error } = await supabase.from("entries").select("*").eq("concept", id);
  if (error) { throw error; }
  return data as Entry[];
}
