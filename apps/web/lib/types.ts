export function languageLabel(code: string) {
  return new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
}

export type Entry = {
  id: number;
  concept: number;
  lang: number;
  expr: string;
  score?: number;
};

export type UserProfile = {
  id: string;
  email?: string;
  role: "member" | "editor" | "admin";
  username: string;
  display_name: string | null;
};

export type EntryCreate = {
  lang: number;
  expr: string;
};

export type EntryRemove = {
  id: number;
};

export type SubmissionPayload = {
  concept?: number;
  subsume?: number;
  removes?: EntryRemove[];
  creates?: EntryCreate[];
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
