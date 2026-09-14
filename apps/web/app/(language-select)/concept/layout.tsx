"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getConceptAction } from "@/app/actions";
import { supabase } from "@/lib/client";
import { languageLabel, type Entry, type LanguageCode } from "@/lib/types";
import { useActiveLanguages, useAvailableLanguages, useSelectedLanguages } from "../LanguageProvider";
import "./layout.css";

type LanguageView = "all" | "selected" | "active";
type EntryUpdate = {
  action: "create" | "update" | "delete";
  language: LanguageCode;
  entry_id?: number;
  expression: string;
};

function entriesForLanguage(entries: Entry[], language: LanguageCode) {
  return entries.filter(entry => entry.language === language);
}

function EntryRows({
  languages,
  entries,
  editing,
  updates,
  onUpdate,
  onAdd,
  onDelete,
}: {
  languages: LanguageCode[];
  entries: Entry[];
  editing: boolean;
  updates: EntryUpdate[];
  onUpdate: (entry: Entry, expression: string) => void;
  onAdd: (language: LanguageCode) => void;
  onDelete: (entry: Entry) => void;
}) {
  return <div className="entries-grid">{languages.map(language => {
    const languageEntries = entriesForLanguage(entries, language);
    const languageUpdates = updates.filter(update => update.language === language && update.action === "create");
    return <div className="entry" key={language}>
      <div className="entry-language">{languageLabel(language)}</div>
      <div className="entry-words">
        {languageEntries.map(entry => {
          const update = updates.find(item => item.entry_id === entry.entry_id);
          const deleted = update?.action === "delete";
          return <div className={`editor-word ${deleted ? "deleted" : ""}`} key={entry.entry_id}>
            {editing ? <input value={deleted ? "" : update?.expression ?? entry.expression} disabled={deleted} onChange={event => onUpdate(entry, event.target.value)} /> : <span className="entry-word">{entry.expression}</span>}
            {editing && <button className="editor-delete" type="button" onClick={() => onDelete(entry)} aria-label={`${deleted ? "Restore" : "Delete"} ${entry.expression}`}>{deleted ? "+" : "-"}</button>}
          </div>;
        })}
        {languageUpdates.map((update, index) => <div className="editor-word" key={`${language}-new-${index}`}><input value={update.expression} onChange={event => {
          onUpdate({ concept_id: 0, language, entry_id: update.entry_id!, expression: update.expression, indexed: true }, event.target.value);
        }} placeholder="New expression" /><button className="editor-delete" type="button" onClick={() => onDelete({ concept_id: 0, language, entry_id: update.entry_id!, expression: update.expression, indexed: true })} aria-label="Delete new entry">-</button></div>)}
        {!languageEntries.length && !languageUpdates.length && !editing && <span className="concept-muted">No entries</span>}
        {editing && <button className="editor-add" type="button" onClick={() => onAdd(language)}>Add entry</button>}
      </div>
    </div>;
  })}</div>;
}

export default function ConceptLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [availableLanguages] = useAvailableLanguages();
  const [selectedLanguages] = useSelectedLanguages();
  const [activeLanguages] = useActiveLanguages();
  const [currentEntries, setCurrentEntries] = useState<Entry[]>([]);
  const [compareEntries, setCompareEntries] = useState<Entry[]>([]);
  const [updates, setUpdates] = useState<EntryUpdate[]>([]);
  const [view, setView] = useState<LanguageView>("active");
  const [editing, setEditing] = useState(pathname.endsWith("/create"));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isCreate = pathname.endsWith("/create");
  const currentId = isCreate ? undefined : Number(pathname.split("/").pop());
  const compareId = Number(searchParams.get("compare"));
  const validCompareId = Number.isInteger(compareId) ? compareId : undefined;
  const languages = view === "all" ? availableLanguages : view === "selected" ? selectedLanguages : activeLanguages;
  const displayLanguages = languages.length ? languages : availableLanguages;

  useEffect(() => {
    setEditing(isCreate);
    setUpdates([]);
    setMessage("");
    if (!isCreate && !Number.isInteger(currentId)) {
      setCurrentEntries([]);
      setCompareEntries([]);
      return;
    }
    let mounted = true;
    setLoading(true);
    Promise.all([
      isCreate ? Promise.resolve([]) : getConceptAction(currentId as number),
      validCompareId === undefined ? Promise.resolve([]) : getConceptAction(validCompareId),
    ]).then(([entries, compared]) => {
      if (mounted) {
        setCurrentEntries(entries);
        setCompareEntries(compared);
      }
    }).catch(() => {
      if (mounted) setMessage("Could not load concept.");
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [pathname, isCreate, currentId, validCompareId]);

  function updateEntry(entry: Entry, expression: string) {
    setUpdates(items => {
      const existing = items.findIndex(item => item.entry_id === entry.entry_id);
      const next: EntryUpdate = { entry_id: entry.entry_id, language: entry.language, expression, action: entry.entry_id < 0 ? "create" : "update" };
      if (existing < 0) return [...items, next];
      return items.map((item, index) => index === existing ? next : item);
    });
  }

  function addEntry(language: LanguageCode) {
    setUpdates(items => [...items, { entry_id: -Date.now(), language, expression: "", action: "create" }]);
  }

  function deleteEntry(entry: Entry) {
    const existing = updates.find(item => item.entry_id === entry.entry_id);
    if (entry.entry_id < 0) {
      setUpdates(items => items.filter(item => item.entry_id !== entry.entry_id));
    } else if (existing?.action === "delete") {
      setUpdates(items => items.filter(item => item.entry_id !== entry.entry_id));
    } else {
      setUpdates(items => [...items.filter(item => item.entry_id !== entry.entry_id), { entry_id: entry.entry_id, language: entry.language, expression: entry.expression, action: "delete" }]);
    }
  }

  async function submit() {
    const payload = { type: isCreate ? "create_concept" : "edit_concept", concept_id: currentId, updates: updates.filter(update => update.action === "delete" || update.expression.trim()).map(update => ({ ...update, expression: update.expression.trim() })) };
    const { error } = await supabase.from("submissions").insert({ payload });
    setMessage(error ? "Submission failed." : "Submitted for review.");
  }

  if (!pathname.startsWith("/concept")) return <>{children}</>;
  if (loading) return <main className="concept-page"><p className="concept-empty">Loading concept...</p></main>;
  if (!isCreate && !Number.isInteger(currentId)) return <main className="concept-page"><p className="concept-empty">Invalid concept id.</p></main>;

  const hasCompare = validCompareId !== undefined && validCompareId !== currentId;
  return <main className="concept-page"><section className="results concept-results"><article className="concept-card">
    <div className="concept-heading"><span className="concept-title">{isCreate ? "Create concept" : `Concept ${currentId}`}</span><nav className="concept-actions" aria-label="Concept actions">
      {!isCreate && <button type="button" onClick={() => setEditing(value => !value)}>{editing ? "View" : "Edit"}</button>}
      {!isCreate && <Link href={`/concept/create?compare=${currentId}`}>Create from this</Link>}
    </nav></div>
    <form className="compare-form" action={isCreate ? "/concept/create" : `/concept/${currentId}`}><label htmlFor="compare-id">Compare with</label><input id="compare-id" name="compare" defaultValue={searchParams.get("compare") ?? ""} placeholder="Concept id" /><button type="submit">Compare</button></form>
    <div className="language-views" aria-label="Languages to display">{(["all", "selected", "active"] as LanguageView[]).map(option => <button key={option} type="button" className={view === option ? "current" : ""} onClick={() => setView(option)}>{option === "all" ? "All languages" : option[0].toUpperCase() + option.slice(1)}</button>)}</div>
    {hasCompare ? <div className="compare-grid"><div><h2>{isCreate ? "New concept" : `Concept ${currentId}`}</h2><EntryRows languages={displayLanguages} entries={currentEntries} editing={editing} updates={updates} onUpdate={updateEntry} onAdd={addEntry} onDelete={deleteEntry} /></div><div><h2>Concept {validCompareId}</h2><EntryRows languages={displayLanguages} entries={compareEntries} editing={false} updates={[]} onUpdate={updateEntry} onAdd={addEntry} onDelete={deleteEntry} /></div></div> : <EntryRows languages={displayLanguages} entries={currentEntries} editing={editing} updates={updates} onUpdate={updateEntry} onAdd={addEntry} onDelete={deleteEntry} />}
    {editing && <button type="button" onClick={submit}>Submit</button>}{message && <p role="status">{message}</p>}
  </article></section></main>;
}
