"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types";

export const supabase = createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);

export async function getConceptEntries(id: number) {
  const { data, error } = await supabase.rpc("read_concept", { concept_id: id });
  if (error) { throw error; }
  return data;
}
