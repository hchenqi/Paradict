export function languageLabel(code: string) {
  return new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
}

export type Entry = {
  concept: number;
  lang: number;
  expr: string;
  score?: number;
};

export type ConceptEntry = {
  lang: number;
  expr: string;
};

export type UserProfile = {
  id: string;
  email?: string;
  role: "member" | "editor" | "admin";
  username: string;
  display_name: string | null;
};

export type ConceptOperation =
  | { type: "create"; creates: ConceptEntry[] }
  | { type: "update"; concept: number; removes: ConceptEntry[]; creates: ConceptEntry[] }
  | { type: "delete"; concept: number };

export type SubmissionPayload = ConceptOperation[];

export type Submission = {
  id: number;
  created_by?: string;
  created_at: string;
  payload: SubmissionPayload;
  review_status: "pending" | "committed" | "rejected";
  reviewed_by?: string;
  reviewed_at?: string;
};
