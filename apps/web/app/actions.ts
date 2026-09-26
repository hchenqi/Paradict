"use server";

import { getLanguages, getRandomConcepts } from "@/lib/server";

export async function languagesAction() {
  return getLanguages();
}

export async function exploreAction() {
  return getRandomConcepts();
}
