import "server-only";

import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";
import type { LanguageCode, Entry } from "@/lib/types";

const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
});

type Cache = {
  languageList: LanguageCode[],
  languageIdCodeMap: Map<number, LanguageCode>,
  languageCodeIdMap: Map<LanguageCode, number>,
  randomConcepts: Entry[],
  expiresAt: number,
};

const cache = (globalThis as typeof globalThis & { __paradictServerCache?: Cache; }).__paradictServerCache ??= {
  languageList: [],
  languageIdCodeMap: new Map<number, LanguageCode>(),
  languageCodeIdMap: new Map<LanguageCode, number>(),
  randomConcepts: [],
  expiresAt: Date.now(),
};

async function queryLanguages() {
  const { data, error } = await supabase.from("languages").select("id, iso_code");
  if (error) { throw error; }
  const languageList: LanguageCode[] = [];
  const languageIdCodeMap = new Map<number, LanguageCode>();
  const languageCodeIdMap = new Map<LanguageCode, number>();
  for (const language of data) {
    languageList.push(language.iso_code);
    languageIdCodeMap.set(language.id, language.iso_code);
    languageCodeIdMap.set(language.iso_code, language.id);
  }
  cache.languageList = languageList;
  cache.languageIdCodeMap = languageIdCodeMap;
  cache.languageCodeIdMap = languageCodeIdMap;
}

function transformResultRows(
  rows: Array<{
    concept_id: number;
    language_id: number;
    entry_id: number;
    expression: string;
    indexed: boolean;
  }>
) {
  return rows.map(row => ({
    concept: row.concept_id,
    language: cache.languageIdCodeMap.get(row.language_id)!,
    id: row.entry_id,
    expression: row.expression,
    indexed: row.indexed,
  }));
}

async function queryRandomConcepts() {
  const { data, error } = await supabase.rpc("explore", { result_limit: 10 });
  if (error) { throw error; }
  cache.randomConcepts = transformResultRows(data);
}

async function checkRefreshCache() {
  if (Date.now() >= cache.expiresAt) {
    await queryLanguages();
    await queryRandomConcepts();
    cache.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  }
}

export async function getLanguageList() {
  await checkRefreshCache();
  return cache.languageList;
}

export async function explore() {
  await checkRefreshCache();
  return cache.randomConcepts;
}

export async function search(query: string, languages: LanguageCode[], result_limit: number) {
  await checkRefreshCache();
  const language_list = languages.map(code => cache.languageCodeIdMap.get(code)).filter(id => id !== undefined);
  if (language_list.length === 0) { return []; }
  const { data, error } = await supabase.rpc("search", { query, language_list, result_limit });
  if (error) { throw error; }
  return transformResultRows(data);
}

export async function getConcept(id: number) {
  await checkRefreshCache();
  const { data, error } = await supabase.from("entries").select("language_id, id, expression, indexed").eq("concept_id", id);
  if (error) { throw error; }
  return data.map(row => ({
    language: cache.languageIdCodeMap.get(row.language_id)!,
    id: row.id,
    expression: row.expression,
    indexed: row.indexed,
  } as Entry));
}
