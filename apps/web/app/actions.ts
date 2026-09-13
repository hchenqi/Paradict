"use server";

import { explore, getConcept } from "@/lib/server";

export async function exploreAction() {
  return explore();
}

export async function getConceptAction(id: number) {
  return getConcept(id);
}
