export type LanguageCode = string;

export type Entry = {
  concept_id: number;
  language: LanguageCode;
  entry_id: number;
  expression: string;
  indexed: boolean;
};

export type Concept = {
  id: number;
  entries: ConceptEntry[];
};

export type ConceptEntry = {
  language: LanguageCode;
  entry_id: number;
  expression: string;
  indexed: boolean;
};

export type LanguageEntry = {
  entry_id: number;
  expression: string;
  indexed: boolean;
};

export function languageLabel(code: LanguageCode) {
  return new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
}

export function groupEntriesByLanguage(
  entries: ConceptEntry[],
  languageList: LanguageCode[],
) {
  return languageList.map((language) => ({
    language,
    entries: entries.filter((entry) => entry.language === language),
  }));
}
