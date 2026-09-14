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
  role: string;
  username: string;
  display_name: string | null;
};

export type EntryCreate = {
  id?: number;
  language: LanguageCode;
  expression: string;
  indexed: boolean;
};

export type EntryUpdate = {
  id: number;
  expression?: string;
  indexed?: boolean;
};

export type EntryDelete = {
  id: number;
};

export type CreateConceptPayload = {
  type: "create-concept";
  entries: EntryCreate[];
};

export type UpdateConceptPayload = {
  type: "update-concept";
  id: number;
  merge?: number;
  create: EntryCreate[];
  update: EntryUpdate[];
  delete: EntryDelete[];
};

export type SubmissionPayload = CreateConceptPayload | UpdateConceptPayload;

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
