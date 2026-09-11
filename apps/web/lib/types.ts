export type LanguageCode = string;

export function languageLabel(code: LanguageCode) {
  return new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
}

export type Entry = {
  concept_id: number;
  language: LanguageCode;
  entry_id: number;
  expression: string;
  indexed: boolean;
};

export function groupEntriesByConcept(entries: Entry[]) {
  return Map.groupBy(entries, entry => entry.concept_id);
}
