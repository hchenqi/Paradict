"use server";

import { explore, getConcept } from "@/lib/server";
import type { LanguageCode } from "@/lib/types";

export async function exploreAction() {
  return explore();
}

export async function getConceptAction(id: number, languages: LanguageCode[]) {
  return getConcept(id, languages);
}
