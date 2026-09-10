export type LanguageCode = string;
export type Language = { code: LanguageCode };
export type DictionaryEntry = {
  id: number;
  language: LanguageCode;
  text: string;
};
export type Concept = { id: number; entries: DictionaryEntry[] };
export type LanguageEntries = {
  language: LanguageCode;
  entries: DictionaryEntry[];
};

export function languageLabel(code: LanguageCode, displayLocale?: string) {
  const normalizedCode = code.toLowerCase();
  return (
    new Intl.DisplayNames(displayLocale ? [normalizedCode] : undefined, {
      type: "language",
    }).of(normalizedCode) ?? code
  );
}

export function groupEntriesByLanguage(
  concept: Concept,
  selectedLanguages: LanguageCode[],
): LanguageEntries[] {
  return selectedLanguages
    .map((language) => ({
      language,
      entries: concept.entries.filter((entry) => entry.language === language),
    }))
    .filter((group) => group.entries.length > 0);
}
