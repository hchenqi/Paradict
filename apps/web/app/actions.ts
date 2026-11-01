"use server";

import { getLanguages } from "@/lib/server";

export async function languagesAction() {
  return getLanguages();
}
