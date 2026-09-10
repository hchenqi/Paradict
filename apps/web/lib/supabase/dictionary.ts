import "server-only";

import type { Concept, DictionaryEntry, LanguageCode } from "../dictionary";
import { getSupabaseServerClient } from "./server";

function isLanguageCode(value: string): value is LanguageCode {
  return value.length > 0;
}

function rowsToConcepts(
  rows: Array<{
    concept_id: number;
    entry_id: number;
    language_id: number;
    expression: string;
  }>,
  languageCodes: Map<number, LanguageCode>,
): Concept[] {
  const concepts = new Map<number, Concept>();
  for (const row of rows) {
    const languageCode = languageCodes.get(row.language_id);
    if (!languageCode || !isLanguageCode(languageCode)) continue;
    const concept = concepts.get(row.concept_id) ?? {
      id: row.concept_id,
      entries: [],
    };
    concept.entries.push({
      id: row.entry_id,
      language: languageCode,
      text: row.expression,
    });
    concepts.set(row.concept_id, concept);
  }
  return [...concepts.values()];
}

type DictionaryRow = {
  concept_id: number;
  entry_id: number;
  language_id: number;
  expression: string;
};

type DictionaryCache = {
  languageCodes?: { day: string; values: Map<number, LanguageCode> };
  random?: { day: string; concepts: Concept[] };
};

type ServerSupabaseClient = NonNullable<
  Awaited<ReturnType<typeof getSupabaseServerClient>>
>;

async function getAuthenticatedUser(supabase: ServerSupabaseClient) {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    if (error instanceof Error && error.name === "AuthSessionMissingError")
      return null;
    throw error;
  }
}

const cache = ((globalThis as typeof globalThis & {
  __paradictDictionaryCache?: DictionaryCache;
}).__paradictDictionaryCache ??= {});

async function getLanguageCodes(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
) {
  const day = new Date().toISOString().slice(0, 10);
  if (cache.languageCodes?.day === day) return cache.languageCodes.values;
  const { data, error } = await supabase
    .from("languages")
    .select("id, iso_code")
    .order("id");
  if (error) throw error;
  const values = new Map(
    (data ?? []).map((language) => [language.id, language.iso_code]),
  );
  cache.languageCodes = { day, values };
  return values;
}

export async function getLanguages() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const languageCodes = await getLanguageCodes(supabase);
  return [...languageCodes.entries()].map(([id, iso_code]) => ({
    id,
    iso_code,
  }));
}

async function getRandomConcepts(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
  languageCodes: Map<number, LanguageCode>,
) {
  const day = new Date().toISOString().slice(0, 10);
  if (cache.random?.day === day) return cache.random.concepts;

  const { data: ids, error: idError } = await supabase.rpc(
    "explore",
    { result_limit: 10 },
  );
  if (idError) throw idError;
  const rows = (ids ?? []) as DictionaryRow[];
  if (!rows.length) {
    cache.random = { day, concepts: [] };
    return [];
  }
  const concepts = rowsToConcepts(
    rows.map((row) => ({
      concept_id: row.concept_id,
      entry_id: row.entry_id,
      language_id: row.language_id,
      expression: row.expression,
    })),
    languageCodes,
  );
  cache.random = { day, concepts };
  return concepts;
}

export async function search(
  query: string,
  selectedLanguages: LanguageCode[],
  limit = 24,
) {
  const supabase = await getSupabaseServerClient();
  if (!supabase || !selectedLanguages.length) return null;
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];
  const languageCodes = await getLanguageCodes(supabase);
  const languageIds = selectedLanguages
    .map((code) =>
      [...languageCodes.entries()].find(([, value]) => value === code)?.[0],
    )
    .filter((id): id is number => Number.isInteger(id));
  if (languageIds.length !== selectedLanguages.length) return [];
  const { data, error } = await supabase.rpc("search", {
    query: normalizedQuery,
    language_list: languageIds,
    result_limit: limit,
  });
  if (error) throw error;
  return rowsToConcepts(
    (data ?? []) as Array<{
      concept_id: number;
      entry_id: number;
      language_id: number;
      expression: string;
    }>,
    languageCodes,
  );
}

export async function explore() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const languageCodes = await getLanguageCodes(supabase);
  return getRandomConcepts(supabase, languageCodes);
}

export async function getConceptFromSupabase(
  id: number,
  selectedLanguages: LanguageCode[],
) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data: concept, error: conceptError } = await supabase
    .from("concepts")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (conceptError) throw conceptError;
  if (!concept) return undefined;

  let entriesQuery = supabase
    .from("entries")
    .select("id, concept_id, language_id, expression, languages!inner(iso_code)")
    .eq("concept_id", id)
    .eq("indexed", true);
  if (selectedLanguages.length)
    entriesQuery = entriesQuery.in("languages.iso_code", selectedLanguages);
  const { data, error } = await entriesQuery
    .order("language_id")
    .order("expression");
  if (error) throw error;
  const rows = (data ?? []).map((row) => ({
    concept_id: row.concept_id as number,
    entry_id: row.id as number,
    language_id: row.language_id as number,
    expression: row.expression as string,
  }));
  const languageCodes = new Map(
    (data ?? []).map((row) => [
      row.language_id as number,
      (row.languages as unknown as { iso_code: string }).iso_code,
    ]),
  );
  return rowsToConcepts(rows, languageCodes)[0] ?? { id, entries: [] };
}

export async function getUserProfile() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const user = await getAuthenticatedUser(supabase);
  if (!user) return null;
  const { data, error } = await supabase
    .from("users")
    .select("id, role, username, display_name, languages")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateUserPreferences(preferences: {
  displayName?: string | null;
  username?: string | null;
  languageIds?: number[];
}) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const user = await getAuthenticatedUser(supabase);
  if (!user) return undefined;
  const { data, error } = await supabase
    .from("users")
    .update({
      ...(preferences.displayName !== undefined
        ? { display_name: preferences.displayName }
        : {}),
      ...(preferences.username !== undefined
        ? { username: preferences.username }
        : {}),
      ...(preferences.languageIds !== undefined
        ? { languages: preferences.languageIds }
        : {}),
    })
    .eq("id", user.id)
    .select("id, role, username, display_name, languages")
    .single();
  if (error) throw error;
  return data;
}

export type { DictionaryEntry };
