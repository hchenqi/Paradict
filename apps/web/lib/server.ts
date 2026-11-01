import "server-only";

import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
});

type Cache = {
  expiresAt: number;
  languages: [number, string][];
};

const cache = (globalThis as typeof globalThis & { __paradictServerCache?: Cache; }).__paradictServerCache ??= {
  expiresAt: Date.now(),
  languages: [],
};

async function queryLanguages() {
  const { data, error } = await supabase.from("languages").select("id, code");
  if (error) { throw error; }
  cache.languages = data.map(({ id, code }) => [id, code]);
}

async function checkRefreshCache() {
  if (Date.now() >= cache.expiresAt) {
    await queryLanguages();
    cache.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  }
}

export async function getLanguages() {
  await checkRefreshCache();
  return cache.languages;
}
