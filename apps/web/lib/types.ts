export type LanguageCode = string;

export function languageLabel(code: LanguageCode) {
  return new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
}

export type Entry = {
  concept: number;
  language: LanguageCode;
  id: number;
  expression: string;
  indexed: boolean;
};

export function groupEntriesByConcept(entries: Entry[]) {
  return Map.groupBy(entries, entry => entry.concept);
}

export function groupEntriesByLanguage(entries: Entry[]) {
  return Map.groupBy(entries, entry => entry.language);
}

export function groupEntriesByLanguageOrdered(entries: Entry[], languageList: LanguageCode[]) {
  const group = Map.groupBy(entries, entry => entry.language);
  return languageList.map(language => ({ language, entries: group.get(language) ?? [] }));
}

export type UserProfile = {
  id: string;
  email?: string;
  role: "member" | "editor" | "admin";
  username: string;
  display_name: string | null;
};

export type EntryCreate = {
  language: LanguageCode;
  expression: string;
  indexed: boolean;
};

export type EntryUpdate = {
  id: number;
  expression?: string;
  indexed?: boolean;
};

export type EntryRemove = {
  id: number;
};

export type SubmissionPayload = {
  concept_id?: number;
  concept_merge_id?: number;
  create?: EntryCreate[];
  update?: EntryUpdate[];
  remove?: EntryRemove[];
}

export type Submission = {
  id: number;
  created_by?: string;
  created_at: string;
  payload: SubmissionPayload;
  review_status: "pending" | "approved" | "rejected";
  reviewed_by?: string;
  review_note?: string;
  reviewed_at?: string;
};
