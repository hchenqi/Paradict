"use server";

import { explore, getConcept, getLanguageList } from "@/lib/server";

export async function languagesAction() {
  return getLanguageList();
}

export async function exploreAction() {
  return explore();
}

export async function getConceptAction(id: number) {
  return getConcept(id);
}
