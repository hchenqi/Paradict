export type LanguageCode = string;

export type Entry = {
  concept_id: number;
  language: LanguageCode;
  entry_id: number;
  expression: string;
  indexed: boolean;
};

export function languageLabel(code: LanguageCode) {
  return new Intl.DisplayNames([code], { type: "language" }).of(code);
}
