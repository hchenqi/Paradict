"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getConceptAction } from "@/app/actions";
import { supabase } from "@/lib/client";
import { EntryCreate, EntryDelete, EntryUpdate, groupEntriesByLanguage, languageLabel, type Entry, type LanguageCode } from "@/lib/types";
import { useActiveLanguages, useAvailableLanguages, useSelectedLanguages } from "../LanguageProvider";
import "./layout.css";

type LanguageFilter = "all" | "selected" | "active";

function EntryRows({
  languages,
  entries,
  editing,
  creates,
  updates,
  deletes,
  onCreate,
  onUpdate,
  onDelete,
  compareEntries,
}: {
  languages: LanguageCode[];
  entries: Entry[];
  editing: boolean;
  creates: EntryCreate[];
  updates: EntryUpdate[];
  deletes: EntryDelete[];
  onCreate: (language: LanguageCode) => void;
  onUpdate: (entry: EntryUpdate) => void;
  onDelete: (entry: EntryDelete) => void;
  compareEntries?: Entry[];
}) {
  const entriesGroup = groupEntriesByLanguage(entries);
  const createsGroup = Map.groupBy(creates, entry => entry.language);
  const compareEntriesGroup = groupEntriesByLanguage(compareEntries ?? []);
  return (
    <>
      {
        languages.map(language => (
          <div className={compareEntries ? "entry compare" : "entry"} key={language}>
            <div className="entry-language">{languageLabel(language)}</div>
            <div className="entry-words entry-current-words">
              {
                (entriesGroup.get(language) ?? []).map(entry => {
                  const updated = updates.find(item => item.id === entry.id);
                  const deleted = deletes.find(item => item.id === entry.id);
                  return (
                    <div className={`editor-word ${deleted ? "deleted" : ""}`} key={entry.id}>
                      {
                        !editing ? (
                          <span className="entry-word">{entry.expression}</span>
                        ) : (
                          <>
                            <input
                              value={updated && !deleted && updated.expression !== undefined ? updated.expression : entry.expression}
                              disabled={!!deleted}
                              onChange={event => onUpdate({ id: entry.id, expression: event.target.value })}
                              onBlur={event => { const expression = event.currentTarget.value.trim(); if (expression !== event.currentTarget.value) { onUpdate({ id: entry.id, expression }); } }}
                            />
                            <button className="editor-delete" type="button" onClick={() => onDelete(entry)} aria-label={`${deleted ? "Restore" : "Delete"} ${entry.expression}`}>{deleted ? "+" : "-"}</button>
                          </>
                        )
                      }
                    </div>
                  );
                })
              }
              {
                (createsGroup.get(language) ?? []).map((entry, index) => (
                  <div className="editor-word" key={`new-${index}`}>
                    <input
                      value={entry.expression}
                      onChange={event => onUpdate({ id: entry.id!, expression: event.target.value })}
                      onBlur={event => { const expression = event.currentTarget.value.trim(); if (expression !== event.currentTarget.value) { onUpdate({ id: entry.id!, expression }); } }}
                      placeholder="New expression"
                    />
                    <button className="editor-delete" type="button" onClick={() => onDelete({ id: entry.id! })} aria-label="Delete new entry">-</button>
                  </div>
                ))
              }
              {editing && <button className="editor-add" type="button" onClick={() => onCreate(language)}>Add entry</button>}
            </div>
            {
              compareEntries && (
                <div className="entry-words entry-compare-words">
                  {
                    (compareEntriesGroup.get(language) ?? []).map(entry => (
                      <span key={entry.id} className="entry-word">{entry.expression}</span>
                    ))
                  }
                </div>
              )
            }
          </div>
        ))
      }
    </>
  );
}

export default function () {
  const [availableLanguages] = useAvailableLanguages();
  const [selectedLanguages] = useSelectedLanguages();
  const [activeLanguages] = useActiveLanguages();
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>("active");
  const languages = languageFilter === "all" ? availableLanguages : languageFilter === "selected" ? selectedLanguages : activeLanguages;

  const pathname = usePathname();
  const isCreate = pathname.endsWith("/create");
  const currentId = isCreate ? undefined : Number(pathname.split("/").pop());

  const [currentEntries, setCurrentEntries] = useState<Entry[]>([]);
  const [editing, setEditing] = useState(isCreate);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [creates, setCreates] = useState<EntryCreate[]>([]);
  const [updates, setUpdates] = useState<EntryUpdate[]>([]);
  const [deletes, setDeletes] = useState<EntryDelete[]>([]);

  const router = useRouter();
  const [compareEntries, setCompareEntries] = useState<Entry[]>([]);
  const searchParams = useSearchParams();
  const compareId = Number(searchParams.get("compare") || NaN);
  const validCompareId = Number.isInteger(compareId) ? compareId : undefined;
  const hasCompare = validCompareId !== undefined && validCompareId !== currentId;

  useEffect(() => {
    setEditing(isCreate);
    setCreates([]);
    setUpdates([]);
    setDeletes([]);
    setMessage("");

    if (!isCreate && !Number.isInteger(currentId)) {
      setCurrentEntries([]);
      setCompareEntries([]);
      return;
    }

    if (!isCreate) {
      let mounted = true;
      setLoading(true);
      getConceptAction(currentId as number)
        .then(entries => { if (mounted) { setCurrentEntries(entries); } })
        .catch(() => { if (mounted) { setMessage("Could not load concept."); } })
        .finally(() => { if (mounted) { setLoading(false); } });
      return () => { mounted = false; };
    }
  }, [pathname]);

  useEffect(() => {
    if (validCompareId) {
      getConceptAction(validCompareId).then(entries => setCompareEntries(entries));
    }
  }, [searchParams]);

  function updateEntry(update: EntryUpdate) {
    if (update.id < 0) {
      setCreates(items => items.map(item => item.id === update.id ? { ...item, expression: update.expression ?? item.expression } : item));
      return;
    }
    setUpdates(items => {
      const existing = items.findIndex(item => item.id === update.id);
      if (existing < 0) return [...items, update];
      return items.map((item, index) => index === existing ? { ...item, ...update } : item);
    });
  }

  function addEntry(language: LanguageCode) {
    const id = -Math.floor(Math.random() * 2_000_000_000) - 1;
    setCreates(items => [...items, { id, language, expression: "", indexed: true }]);
  }

  function deleteEntry(entry: EntryDelete) {
    if (entry.id < 0) {
      setCreates(items => items.filter(item => item.id !== entry.id));
    } else if (deletes.some(item => item.id === entry.id)) {
      setDeletes(items => items.filter(item => item.id !== entry.id));
    } else {
      setDeletes(items => [...items, entry]);
    }
  }

  async function submit() {
    const payload = isCreate
      ? { type: "create-concept" as const, entries: creates.filter(entry => entry.expression.trim()).map(entry => ({ ...entry, expression: entry.expression.trim() })) }
      : { type: "update-concept" as const, id: currentId!, create: creates.filter(entry => entry.expression.trim()).map(entry => ({ ...entry, expression: entry.expression.trim() })), update: updates, delete: deletes };
    const { error } = await supabase.from("submissions").insert({ payload });
    setMessage(error ? "Submission failed." : "Submitted for review.");
  }

  if (loading) {
    return <p className="concept-empty">Loading...</p>
  }

  if (!isCreate && !Number.isInteger(currentId)) {
    return <p className="concept-empty">Invalid concept id.</p>
  }

  return (
    <article className="concept-card">
      {message && <p role="status">{message}</p>}
      <nav className="concept-actions" aria-label="Concept actions">
        <form className="compare-form" onSubmit={event => {
          event.preventDefault();
          const form = event.currentTarget;
          const compareId = new FormData(form).get("compare") as string;
          router.replace(compareId ? `${pathname}?compare=${encodeURIComponent(compareId)}` : pathname);
        }}>
          <input id="compare-id" name="compare" defaultValue={searchParams.get("compare") ?? ""} placeholder="Concept id" />
          <button type="submit">Compare</button>
        </form>
        {!isCreate && <button type="button" onClick={() => setEditing(value => !value)}>{editing ? "View" : "Edit"}</button>}
        {!isCreate && <Link href={`/concept/create?compare=${currentId}`}>Create from this</Link>}
        {editing && <button type="button" onClick={submit}>Submit</button>}
      </nav>
      <div className="entries-grid">
        <div className={hasCompare ? "entry compare" : "entry"}>
          <select className="language-filter" aria-label="Languages to display" value={languageFilter} onChange={event => setLanguageFilter(event.target.value as LanguageFilter)}>
            {
              (["all", "selected", "active"] as LanguageFilter[]).map(option => (
                <option key={option} value={option}>
                  {option === "all" ? "All languages" : option[0].toUpperCase() + option.slice(1)}
                </option>
              ))
            }
          </select>
          <span className="concept-title">{isCreate ? "New concept" : `Concept ${currentId}`}</span>
          {hasCompare && <span className="concept-title concept-compare-title">Concept {validCompareId}</span>}
        </div>
        <EntryRows languages={languages} entries={currentEntries} editing={editing} creates={creates} updates={updates} deletes={deletes} onUpdate={updateEntry} onCreate={addEntry} onDelete={deleteEntry} compareEntries={hasCompare ? compareEntries : undefined} />
      </div>
    </article>
  );
}
