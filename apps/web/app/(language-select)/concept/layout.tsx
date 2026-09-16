"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { getConceptAction } from "@/app/actions";
import { supabase } from "@/lib/client";
import { EntryCreate, EntryDelete, EntryUpdate, groupEntriesByLanguage, languageLabel, type Entry, type LanguageCode } from "@/lib/types";
import { useActiveLanguages, useAvailableLanguages, useSelectedLanguages } from "../LanguageProvider";
import "./layout.css";

type LanguageFilter = "all" | "selected" | "active";

function useLanguageFilter(): [LanguageCode[], LanguageFilter, (languageFilter: LanguageFilter) => void] {
  const [availableLanguages] = useAvailableLanguages();
  const [selectedLanguages] = useSelectedLanguages();
  const [activeLanguages] = useActiveLanguages();
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>("active");
  const languages = languageFilter === "all" ? availableLanguages : languageFilter === "selected" ? selectedLanguages : activeLanguages;
  return [languages, languageFilter, setLanguageFilter];
}

function CompareEntriesLoader({ currentId, setCompare }: { currentId: number | undefined; setCompare: (compare: { id: number, entries: Entry[] } | undefined) => void; }) {
  const searchParams = useSearchParams();
  const compareId = Number(searchParams.get("compare") || NaN);
  const validCompareId = Number.isInteger(compareId) ? compareId : undefined;
  const hasCompare = validCompareId !== undefined && validCompareId !== currentId;

  useEffect(() => {
    if (hasCompare) {
      getConceptAction(validCompareId).then(entries => setCompare({ id: validCompareId, entries }));
    } else {
      setCompare(undefined);
    }
  }, [validCompareId]);

  return null;
}

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
  return languages.map(language => (
    <div className={`row ${compareEntries ? "compare" : ""}`} key={language}>
      <div className="label">{languageLabel(language)}</div>
      <div className="entries">
        {
          (entriesGroup.get(language) ?? []).map(entry => {
            const updated = updates.find(item => item.id === entry.id);
            const deleted = deletes.find(item => item.id === entry.id);
            return !editing ? (
              <span className="entry" key={entry.id}>{entry.expression}</span>
            ) : (
              <div className="entry edit" key={entry.id}>
                <input
                  value={updated && !deleted && updated.expression !== undefined ? updated.expression : entry.expression}
                  disabled={!!deleted}
                  onChange={event => onUpdate({ id: entry.id, expression: event.target.value })}
                  onBlur={event => { const expression = event.currentTarget.value.trim(); if (expression !== event.currentTarget.value) { onUpdate({ id: entry.id, expression }); } }}
                />
                <button type="button" onClick={() => onDelete(entry)} aria-label={`${deleted ? "Restore" : "Delete"} ${entry.expression}`}>{deleted ? "+" : "-"}</button>
              </div>
            );
          })
        }
        {
          (createsGroup.get(language) ?? []).map((entry, index) => (
            <div key={`new-${index}`}>
              <input
                value={entry.expression}
                onChange={event => onUpdate({ id: entry.id!, expression: event.target.value })}
                onBlur={event => { const expression = event.currentTarget.value.trim(); if (expression !== event.currentTarget.value) { onUpdate({ id: entry.id!, expression }); } }}
                placeholder="New expression"
              />
              <button type="button" onClick={() => onDelete({ id: entry.id! })} aria-label="Delete new entry">-</button>
            </div>
          ))
        }
        {editing && <button type="button" onClick={() => onCreate(language)}>Add entry</button>}
      </div>
      {
        compareEntries && (
          <div className="entries compare">
            {
              (compareEntriesGroup.get(language) ?? []).map(entry => (
                <span className="entry" key={entry.id}>{entry.expression}</span>
              ))
            }
          </div>
        )
      }
    </div>
  ));
}

export default function () {
  const [languages, languageFilter, setLanguageFilter] = useLanguageFilter();

  const pathname = usePathname();
  const isCreate = pathname.endsWith("/create");
  const currentId = isCreate ? undefined : Number(pathname.split("/").pop());

  const [currentEntries, setCurrentEntries] = useState<Entry[]>([]);
  const [editing, setEditing] = useState(isCreate);
  const [message, setMessage] = useState("");

  const [creates, setCreates] = useState<EntryCreate[]>([]);
  const [updates, setUpdates] = useState<EntryUpdate[]>([]);
  const [deletes, setDeletes] = useState<EntryDelete[]>([]);

  const [compare, setCompare] = useState<{ id: number, entries: Entry[] } | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    setEditing(isCreate);
    setCreates([]);
    setUpdates([]);
    setDeletes([]);
    setMessage("");
    if (!isCreate) {
      if (Number.isInteger(currentId)) {
        let mounted = true;
        getConceptAction(currentId as number)
          .then(entries => { if (mounted) { setCurrentEntries(entries); } })
          .catch(() => { if (mounted) { setMessage("Could not load concept."); } })
        return () => { mounted = false; };
      } else {
        setCurrentEntries([]);
        setMessage("Invalid concept id.");
      }
    }
  }, [pathname]);

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

  return (
    <article className="concept">
      <Suspense><CompareEntriesLoader currentId={currentId} setCompare={setCompare} /></Suspense>
      {message && <p role="status">{message}</p>}
      <nav>
        <select aria-label="Languages to display" value={languageFilter} onChange={event => setLanguageFilter(event.target.value as LanguageFilter)}>
          {
            (["all", "selected", "active"] as LanguageFilter[]).map(option => (
              <option key={option} value={option}>
                {option === "all" ? "All languages" : option[0].toUpperCase() + option.slice(1)}
              </option>
            ))
          }
        </select>
        <form onSubmit={event => {
          event.preventDefault();
          const form = event.currentTarget;
          const compareId = new FormData(form).get("compare") as string;
          router.replace(compareId ? `${pathname}?compare=${encodeURIComponent(compareId)}` : pathname);
        }}>
          <input id="compare-id" name="compare" placeholder="Concept id" />
          <button type="submit">Compare</button>
        </form>
        <div>
          {!isCreate && <button type="button" onClick={() => setEditing(value => !value)}>{editing ? "View" : "Edit"}</button>}
          {editing && <button type="button" onClick={submit}>Submit</button>}
        </div>
      </nav>
      <div className={`row header ${compare ? "compare" : ""}`}>
        <span className="current">{isCreate ? "New concept" : `Concept ${currentId}`}</span>
        {compare && <span className="compare">Concept {compare.id}</span>}
      </div>
      <EntryRows languages={languages} entries={currentEntries} editing={editing} creates={creates} updates={updates} deletes={deletes} onUpdate={updateEntry} onCreate={addEntry} onDelete={deleteEntry} compareEntries={compare?.entries} />
    </article>
  );
}
