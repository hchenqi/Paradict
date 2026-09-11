"use server";

import { getConcept } from "@/lib/server";
import type { LanguageCode } from "@/lib/types";

export async function getConceptAction(
  id: number,
  languages: LanguageCode[],
) {
  return getConcept(id, languages);
}
