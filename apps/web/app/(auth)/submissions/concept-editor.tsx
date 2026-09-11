"use client";

import { useState } from "react";
import {
  languageLabel,
  type Concept,
  type LanguageCode,
} from "../../lib/types";

type EditType = "create_concept" | "update_concept" | "merge_concepts";
type DraftEntry = {
  id?: number;
  text: string;
  indexed?: boolean;
  deleted?: boolean;
};
type DraftGroups = Record<string, DraftEntry[]>;

function draftFromConcept(
  concept: Concept | undefined,
  languages: LanguageCode[],
): DraftGroups {
  return Object.fromEntries(
    languages.map((language) => [
      language,
      (
        concept?.entries.filter((entry) => entry.language === language) ?? []
      ).map((entry) => ({ id: entry.id, text: entry.text })),
    ]),
  );
}

export default function ConceptEditor({
  type,
  concept,
  languages,
}: {
  type: EditType;
  concept?: Concept;
  languages: LanguageCode[];
}) {
  const [groups, setGroups] = useState<DraftGroups>(() =>
    draftFromConcept(concept, languages),
  );
  const [mergeId, setMergeId] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const originalEntries = Object.fromEntries(
    (concept?.entries ?? []).map((entry) => [entry.id, entry.text]),
  );

  function updateEntry(language: string, index: number, text: string) {
    setGroups((current) => ({
      ...current,
      [language]: current[language].map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, text } : entry,
      ),
    }));
  }

  function addEntry(language: string) {
    setGroups((current) => ({
      ...current,
      [language]: [...current[language], { text: "" }],
    }));
  }

  function toggleDeleted(language: string, index: number) {
    setGroups((current) => ({
      ...current,
      [language]: current[language].map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, deleted: !entry.deleted } : entry,
      ),
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    let payload: Record<string, unknown>;
    if (type === "merge_concepts") {
      const duplicateId = Number(mergeId);
      if (
        !Number.isInteger(duplicateId) ||
        duplicateId < 1 ||
        duplicateId === concept?.id
      ) {
        setMessage("Enter a different valid concept id.");
        return;
      }
      payload = { keep_id: concept?.id, duplicate_id: duplicateId };
    } else if (type === "create_concept") {
      const entries = Object.fromEntries(
        Object.entries(groups)
          .map(([language, values]) => [
            language,
            values.map((entry) => entry.text.trim()).filter(Boolean),
          ])
          .filter(([, values]) => values.length),
      );
      if (!Object.keys(entries).length) {
        setMessage("Add at least one word.");
        return;
      }
      payload = { entries };
    } else {
      const added: Record<string, string[]> = {};
      const updated: Array<{ entry_id: number; text: string }> = [];
      const deleted: number[] = [];
      Object.entries(groups).forEach(([language, values]) =>
        values.forEach((entry) => {
          const text = entry.text.trim();
          if (entry.id && entry.deleted) deleted.push(entry.id);
          else if (entry.id && text && originalEntries[entry.id] !== text)
            updated.push({ entry_id: entry.id, text });
          else if (!entry.id && text) (added[language] ??= []).push(text);
        }),
      );
      payload = { concept_id: concept?.id, added, updated, deleted };
    }
    setSaving(true);
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload }),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(
      response.ok
        ? "Submission sent for review."
        : (result.error ?? "Unable to submit edit."),
    );
    setSaving(false);
  }

  return (
    <form className="concept-editor concept-card" onSubmit={submit}>
      <div className="concept-heading">
        <span className="concept-title">
          {type === "create_concept"
            ? "New concept"
            : type === "merge_concepts"
              ? `Merge Concept ${concept?.id ?? ""}`
              : `Update Concept ${concept?.id ?? ""}`}
        </span>
      </div>
      {type === "merge_concepts" ? (
        <label className="editor-field">
          Other concept id
          <input
            value={mergeId}
            onChange={(event) => setMergeId(event.target.value)}
            inputMode="numeric"
          />
        </label>
      ) : (
        <div className="entries-grid">
          {languages.map((language) => (
            <div className="entry editor-entry" key={language}>
              <div className="entry-language">
                {languageLabel(language, language)}
              </div>
              <div className="editor-words">
                {(groups[language] ?? []).map((entry, index) => (
                  <div
                    className={`editor-word ${entry.deleted ? "deleted" : ""}`}
                    key={`${entry.id ?? "new"}-${index}`}
                  >
                    <input
                      value={entry.text}
                      onChange={(event) =>
                        updateEntry(language, index, event.target.value)
                      }
                      aria-label={`${languageLabel(language, language)} word`}
                    />
                    <button
                      className="editor-delete"
                      type="button"
                      onClick={() => toggleDeleted(language, index)}
                      aria-label={
                        entry.deleted ? "Restore word" : "Delete word"
                      }
                    >
                      {entry.deleted ? "+" : "x"}
                    </button>
                  </div>
                ))}
                <button
                  className="editor-add"
                  type="button"
                  onClick={() => addEntry(language)}
                >
                  Add word
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {message && (
        <p className="auth-message" role="status">
          {message}
        </p>
      )}
      <button className="auth-submit" type="submit" disabled={saving}>
        {saving ? "Sending..." : "Submit edit"}
      </button>
    </form>
  );
}
