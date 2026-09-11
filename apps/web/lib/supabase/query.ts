import "server-only";

import type { LanguageCode, Entry } from "../types";
import { getSupabasePublicClient } from "./server";

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
  const supabase = getSupabasePublicClient();
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
    concept_id: row.concept_id,
    language: cache.languageIdCodeMap.get(row.language_id)!,
    entry_id: row.entry_id,
    expression: row.expression,
    indexed: row.indexed,
  }));
}

async function queryRandomConcepts() {
  const supabase = getSupabasePublicClient();
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

export async function search(query: string, selectedLanguages: LanguageCode[], limit: number) {
  const supabase = await getSupabasePublicClient();
  const { data, error } = await supabase.rpc("search", {
    query,
    language_list: selectedLanguages.map(code => cache.languageCodeIdMap.get(code)).filter(id => id !== undefined),
    result_limit: limit,
  });
  if (error) { throw error; }
  return transformResultRows(data);
}

export async function getConcept(id: number, selectedLanguages: LanguageCode[]) {
  const supabase = await getSupabasePublicClient();
  const { data, error } = await supabase
    .from("entries")
    .select("language_id, id, expression, indexed")
    .eq("concept_id", id)
    .in("language_id", selectedLanguages.map(code => cache.languageCodeIdMap.get(code)).filter(id => id !== undefined));
  if (error) { throw error; }

  return data.map(row => ({
    language: cache.languageIdCodeMap.get(row.language_id)!,
    entry_id: row.id,
    expression: row.expression,
    indexed: row.indexed,
  }));
}
