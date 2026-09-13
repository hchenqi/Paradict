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

export function groupEntriesByLanguage(entries: Entry[], languageList: LanguageCode[]) {
  const group = Map.groupBy(entries, entry => entry.language);
  return languageList.map(language => ({ language, entries: group.get(language) ?? [] }));
}

export type UserProfile = {
  id: string;
  email?: string;
  role: string;
  username: string;
  display_name: string | null;
};

export type SubmissionPayload = {

};

export type Submission = {
  id: number;
  created_by?: string;
  created_at: string;
  payload: SubmissionPayload;
  review_status: string;
  reviewed_by?: string;
  review_note?: string;
  reviewed_at?: string;
};
