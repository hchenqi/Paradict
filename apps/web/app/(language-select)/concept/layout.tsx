"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/client";
import { EntryCreate, EntryRemove, EntryUpdate, groupEntriesByLanguage, languageLabel, SubmissionPayload, type Entry, type LanguageCode } from "@/lib/types";
import { useUserProfile } from "@/app/AuthProvider";
import { useActiveLanguages, useAvailableLanguages, useSelectedLanguages } from "@/app/LanguageProvider";
import { getConceptAction } from "@/app/actions";
import "./layout.css";

type LanguageFilter = "all" | "selected" | "active";

function useLanguageFilter(): [LanguageCode[], LanguageFilter, (languageFilter: LanguageFilter) => void] {
  const availableLanguages = useAvailableLanguages();
  const [selectedLanguages] = useSelectedLanguages();
  const [activeLanguages] = useActiveLanguages();
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>("active");
  const languages = languageFilter === "all" ? availableLanguages : languageFilter === "selected" ? selectedLanguages : activeLanguages;

  useEffect(() => {
    setLanguageFilter(localStorage.getItem("language-filter") as LanguageFilter | null ?? languageFilter);
  }, []);

  return [languages, languageFilter, (languageFilter: LanguageFilter) => { localStorage.setItem("language-filter", languageFilter); setLanguageFilter(languageFilter); }];
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

type EntryCreateTemp = EntryCreate & { id: number; };

function EntryRows({
  languages,
  entries,
  editing,
  creates,
  updates,
  removes,
  onCreate,
  onUpdate,
  onRemove,
  compareEntries,
}: {
  languages: LanguageCode[];
  entries: Entry[];
  editing: boolean;
  creates: EntryCreateTemp[];
  updates: EntryUpdate[];
  removes: EntryRemove[];
  onCreate: (language: LanguageCode) => void;
  onUpdate: (expression: string, entry: EntryUpdate) => void;
  onRemove: (removed: boolean, entry: EntryRemove) => void;
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
          [...(entriesGroup.get(language) ?? []), ...(createsGroup.get(language) ?? [])].map(entry => {
            const updated = updates.find(item => item.id === entry.id);
            const removed = removes.find(item => item.id === entry.id);
            return (
              <div key={entry.id} className={`entry ${editing ? "edit" : ""} ${entry.id < 0 ? "created" : ""} ${updated ? "updated" : ""} ${removed ? "removed" : ""}`}>
                <span
                  contentEditable={editing && !removed}
                  suppressContentEditableWarning
                  style={{ cursor: removed ? "default" : "text" }}
                  onKeyDown={event => { if (event.key === "Enter" || event.key === "NumpadEnter") { event.preventDefault(); } }}
                  onPaste={event => { event.preventDefault(); const text = (event.clipboardData.getData("text/plain") ?? "").replace(/\r?\n|\r/g, " "); document.execCommand("insertText", false, text); }}
                  onInput={event => onUpdate(entry.expression, { id: entry.id, expression: event.currentTarget.textContent })}
                  onBlur={event => { const expression = event.currentTarget.textContent.replace(/\s+/g, " ").trim(); if (expression !== event.currentTarget.textContent) { event.currentTarget.textContent = expression; onUpdate(entry.expression, { id: entry.id, expression }); } }}
                >
                  {entry.expression}
                </span>
                {editing && <button type="button" onClick={() => onRemove(!!removed, { id: entry.id })} aria-label={`${removed ? "Restore" : "Remove"}`}>{removed ? "+" : "-"}</button>}
              </div>
            );
          })
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
  const { userProfile } = useUserProfile();
  const [languages, languageFilter, setLanguageFilter] = useLanguageFilter();

  const pathname = usePathname();
  const isCreate = pathname.endsWith("/create");
  const currentId = isCreate ? undefined : Number(pathname.split("/").pop());

  const [entries, setEntries] = useState<Entry[]>([]);
  const [editing, setEditing] = useState(isCreate);
  const [message, setMessage] = useState("");

  const [creates, setCreates] = useState<EntryCreateTemp[]>([]);
  const [updates, setUpdates] = useState<EntryUpdate[]>([]);
  const [removes, setRemoves] = useState<EntryRemove[]>([]);

  const [compare, setCompare] = useState<{ id: number, entries: Entry[] } | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    setEntries([]);
    setEditing(isCreate);
    setCreates([]);
    setUpdates([]);
    setRemoves([]);
    if (!isCreate) {
      if (Number.isInteger(currentId)) {
        let mounted = true;
        getConceptAction(currentId as number)
          .then(entries => {
            if (mounted) {
              if (entries.length) {
                setEntries(entries);
              } else {
                setMessage("Concept does not exist.");
                router.push("/concept/create");
              }
            }
          })
          .catch(() => {
            if (mounted) {
              setMessage("Could not load concept.");
            }
          });
        return () => { mounted = false; };
      } else {
        setMessage("Invalid concept id.");
        router.push("/concept/create");
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (userProfile === null && editing) {
      router.push(`/login?redirect=${pathname}`);
    }
  }, [userProfile, editing, router]);

  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  function onCreate(language: LanguageCode) {
    const id = creates.reduce((min, entry) => Math.min(min, entry.id), 0) - 1;
    setCreates(entries => [...entries, { id, language, expression: "", indexed: true }]);
  }

  function onUpdate(expression: string, entryUpdate: EntryUpdate) {
    if (entryUpdate.expression !== expression) {
      setUpdates(entries => {
        const existing = entries.findIndex(entry => entry.id === entryUpdate.id);
        return existing < 0 ? [...entries, entryUpdate] : entries.map((entry, index) => index === existing ? { ...entry, ...entryUpdate } : entry);
      });
    } else {
      setUpdates(entries => entries.filter(entry => entry.id !== entryUpdate.id));
    }
  }

  function onRemove(removed: boolean, entryRemove: EntryRemove) {
    if (!removed) {
      setRemoves(entries => [...entries, entryRemove]);
    } else {
      setRemoves(entries => entries.filter(entry => entry.id !== entryRemove.id));
    }
  }

  async function submit() {
    if (userProfile) {
      const removesMap = new Map(removes.map(entry => [entry.id, entry]));
      const updatesMap = new Map(updates.filter(entry => !removesMap.has(entry.id)).map(entry => [entry.id, entry]));
      const create = creates.filter(entry => removesMap.has(entry.id) ? (removesMap.delete(entry.id), false) : true).map(entry => { const update = updatesMap.get(entry.id); return update ? (updatesMap.delete(entry.id), { ...entry, ...update }) : entry; }).filter(entry => entry.expression);
      const update = [...updatesMap.values()];
      const remove = [...removesMap.values()];
      setCreates(create);
      setUpdates(update);
      setRemoves(remove);
      if ((isCreate && create.length) || (!isCreate && (create.length || update.length || remove.length))) {
        const payload: SubmissionPayload = { concept_id: Number.isInteger(currentId) ? currentId : undefined, concept_merge_id: undefined, create: create.map(entry => ({ ...entry, id: undefined })), update, remove };
        const { error } = await supabase.from("submissions").insert({ created_by: userProfile.id, payload });
        setMessage(error ? "Submission failed." : "Submitted for review.");
      } else {
        setMessage("No changes to submit.");
      }
    } else {
      setMessage("Only members could submit.");
    }
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
                {option === "all" ? "All languages" : option === "active" ? "Active languages" : "Selected languages"}
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
          <input name="compare" placeholder="Concept id" />
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
      <div>
        <EntryRows languages={languages} entries={entries} editing={editing} creates={creates} updates={updates} removes={removes} onCreate={onCreate} onUpdate={onUpdate} onRemove={onRemove} compareEntries={compare?.entries} />
      </div>
    </article>
  );
}
