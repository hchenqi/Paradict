"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getConceptEntries, supabase } from "@/lib/client";
import { Entry, EntryCreate, EntryRemove, languageLabel } from "@/lib/types";
import "./ConceptEdit.css";

function normalizeExpr(expr: string) {
  return expr.normalize('NFC').replace(/[\t\n\r]/g, ' ').replace(/\p{Cc}/gu, '').replace(/ {2,}/g, ' ').trim();
}

function EntryImport({ languages, onImport }: { languages: [number, string][]; onImport: (entries: EntryCreate[]) => void; }) {
  const languageCodeIdMap = useMemo(() => new Map(languages.map(([id, code]) => [code, id])), [languages]);
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  function importEntries(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const parsed: unknown = JSON.parse(json);
      if (!Array.isArray(parsed)) { throw new Error("JSON must be a list of entries."); }
      const imported = new Map<string, EntryCreate>();
      for (const [index, item] of parsed.entries()) {
        if (typeof item !== "object" || item === null || Array.isArray(item)) { throw new Error(`Entry ${index + 1} must have string lang and expr fields.`); }
        const entry = item as Record<string, unknown>;
        if (typeof entry.lang !== "string" || typeof entry.expr !== "string") { throw new Error(`Entry ${index + 1} must have string lang and expr fields.`); }
        const lang = languageCodeIdMap.get(entry.lang.trim());
        if (lang === undefined) { throw new Error(`Entry ${index + 1} has an unknown language code: ${entry.lang}.`); }
        const expr = normalizeExpr(entry.expr);
        if (!expr) { throw new Error(`Entry ${index + 1} has an empty expression.`); }
        imported.set(JSON.stringify([lang, expr]), { lang, expr });
      }
      onImport([...imported.values()]);
      setJson("");
      setError("");
      dialogRef.current?.close();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not read the JSON.");
    }
  }

  useEffect(() => {
    if (open && !dialogRef.current?.open) { dialogRef.current?.showModal(); }
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => { setError(""); setOpen(true); }}>Import</button>
      {
        open && (
          <dialog ref={dialogRef} aria-labelledby="import-title" onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) { dialogRef.current?.close(); } }}>
            <h2 id="import-title">Import entries from JSON</h2>
            <p>Paste a JSON list of entries with language codes, for example: <code>[&#123;"lang":"eng","expr":"hello"&#125;]</code></p>
            <details><summary>Available language codes</summary><p>{languages.map(([, code]) => code).join(", ")}</p></details>
            <form onSubmit={importEntries}>
              <textarea aria-label="Entries JSON" value={json} onChange={event => setJson(event.target.value)} rows={10} autoFocus />
              {error && <p role="alert">{error}</p>}
              <div><button type="button" onClick={() => dialogRef.current?.close()}>Cancel</button><button type="submit">Add entries</button></div>
            </form>
          </dialog>
        )
      }
    </>
  );
}

function LanguageRow({
  lang,
  entries,
  removes,
  creates,
  onRemove,
  onCreate,
  commitRemove,
  commitCreate,
  compare,
  editing,
  canCommit,
}: {
  lang: { id: number; code: string };
  entries: Entry[];
  removes: EntryRemove[];
  creates: EntryCreate[];
  onRemove: (remove: boolean, entry: EntryRemove) => void;
  onCreate: (remove: boolean, entry: EntryCreate) => void;
  commitRemove: (entry: EntryRemove) => void;
  commitCreate: (entry: EntryCreate) => void;
  compare: Entry[] | undefined;
  editing: boolean;
  canCommit: boolean;
}) {
  return (
    <div className={`row ${compare ? "compare" : ""}`}>
      <div className="label">{languageLabel(lang.code)}</div>
      <div className="entries">
        {
          entries.map(entry => {
            const removed = removes.find(item => item.id === entry.id);
            return (
              <div className={`entry ${removed ? "removed" : ""}`} key={entry.id}>
                <span>{entry.expr}</span>
                {editing && <button type="button" onClick={() => onRemove(!removed, { id: entry.id })} aria-label={`${removed ? "Restore" : "Remove"} ${entry.expr} (${lang.code})`}>{removed ? "+" : "-"}</button>}
                {!editing && canCommit && removed && <button type="button" onClick={() => commitRemove(entry)}>Commit</button>}
              </div>
            );
          })
        }
        {
          creates.map(entry => (
            <div className={`entry created`} key={entry.expr}>
              <span>{entry.expr}</span>
              {editing && <button type="button" onClick={() => onCreate(true, entry)} aria-label={`Remove ${entry.expr} (${lang.code})`}>-</button>}
              {!editing && canCommit && <button type="button" onClick={() => commitCreate(entry)}>Commit</button>}
            </div>
          ))
        }
        {
          editing && (
            <form onSubmit={event => {
              event.preventDefault();
              const form = event.currentTarget;
              const expr = normalizeExpr(new FormData(form).get("create") as string);
              expr && onCreate(false, { lang: lang.id, expr });
            }}>
              <input name="create" />
              <button type="submit">Add</button>
            </form>
          )
        }
      </div>
      {
        compare && (
          <div className="entries compare">
            {
              compare.map(entry => {
                const add = !entries.find(({ expr }) => entry.expr === expr) && !creates.find(({ expr }) => entry.expr === expr);
                return (
                  <div className={`entry ${add ? "created" : ""}`} key={entry.id}>
                    <span>{entry.expr}</span>
                    {editing && add && <button type="button" onClick={() => onCreate(false, { lang: lang.id, expr: entry.expr })}>Add</button>}
                  </div>
                )
              })
            }
          </div>
        )
      }
    </div >
  );
}

export default function ({
  languages,
  concept,
  removes,
  creates,
  setRemoves,
  setCreates,
  compare,
  editing,
  canCommit,
  onCreateConcept,
}: {
  languages: [number, string][],
  concept: number | undefined;
  removes: EntryRemove[];
  creates: EntryCreate[];
  setRemoves: (fn: (removes: EntryRemove[]) => EntryRemove[]) => void,
  setCreates: (fn: (creates: EntryCreate[]) => EntryCreate[]) => void,
  compare: number | undefined;
  editing: boolean;
  canCommit: boolean;
  onCreateConcept: (entries: EntryCreate[]) => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [committing, setCommitting] = useState(false);
  const [showEmptyRows, setShowEmptyRows] = useState(false);

  const [entries, setEntries] = useState<Entry[]>([]);
  const entryGroups = useMemo(() => Map.groupBy(entries, entry => entry.lang), [entries]);
  const entryExprIdMap = useMemo(() => new Map(entries.map(({ id, lang, expr }) => [JSON.stringify([lang, expr]), id])), [entries]);

  const createGroups = useMemo(() => Map.groupBy(creates, entry => entry.lang), [creates]);

  const [compareDeleted, setCompareDeleted] = useState(false);
  const hasCompare = compare && compare !== concept && !compareDeleted;
  const [compareEntries, setCompareEntries] = useState<Entry[]>([]);
  const compareEntryGroups = useMemo(() => Map.groupBy(compareEntries, entry => entry.lang), [compareEntries]);

  useEffect(() => {
    setEntries([]);
    if (concept) {
      let mounted = true;
      getConceptEntries(concept)
        .then(entries => mounted && (entries ? setEntries(entries) : setMessage("Concept does not exist.")))
        .catch(() => mounted && setMessage("Could not load concept."));
      return () => { mounted = false; };
    }
  }, [concept]);

  useEffect(() => {
    setCreates(creates => creates.filter(({ lang, expr }) => !entryExprIdMap.get(JSON.stringify([lang, expr]))));
  }, [entries]);

  useEffect(() => {
    setCompareEntries([]);
    if (hasCompare) {
      let mounted = true;
      getConceptEntries(compare)
        .then(entries => mounted && (entries ? setCompareEntries(entries) : setMessage("Concept to compare does not exist.")))
        .catch(() => mounted && setMessage("Could not load concept to compare."));
      return () => { mounted = false; };
    }
  }, [concept, compare]);

  function onRemove(remove: boolean, entry: EntryRemove) {
    if (remove) {
      setRemoves(entries => [...entries, entry]);
    } else {
      setRemoves(entries => entries.filter(({ id }) => id !== entry.id));
    }
  }

  function onCreate(remove: boolean, entry: EntryCreate) {
    if (!remove) {
      const id = entryExprIdMap.get(JSON.stringify([entry.lang, entry.expr]));
      if (id) {
        setRemoves(entries => entries.filter(entry => entry.id !== id));
      } else {
        if (!creates.find(({ lang, expr }) => lang === entry.lang && expr === entry.expr)) {
          setCreates(entries => [...entries, entry]);
        }
      }
    } else {
      setCreates(entries => entries.filter(other => other !== entry));
    }
  }

  function addEntries(entries: EntryCreate[]) {
    const idsToRestore = new Set(entries.map(({ lang, expr }) => entryExprIdMap.get(JSON.stringify([lang, expr]))).filter((id): id is number => id !== undefined));
    const entriesToCreate = entries.filter(({ lang, expr }) => !entryExprIdMap.has(JSON.stringify([lang, expr])) && !creates.some(entry => entry.lang === lang && entry.expr === expr)).map(({ lang, expr }) => ({ lang, expr }));
    if (idsToRestore.size) { setRemoves(removes => removes.filter(({ id }) => !idsToRestore.has(id))); }
    if (entriesToCreate.length) { setCreates(creates => [...creates, ...entriesToCreate.filter(entry => !creates.some(({ lang, expr }) => entry.lang === lang && entry.expr === expr))]); }
  }

  async function commitRemove(entry: EntryRemove) {
    const { error } = await supabase.from("entries").delete().eq("id", entry.id);
    if (error) {
      setMessage("Commit failed.");
    } else {
      setEntries(entries => entries.filter(({ id }) => id !== entry.id));
    }
  }

  async function commitCreate(entry: EntryCreate) {
    if (concept === undefined) {
      return setMessage("Create a concept before committing changes.");
    }
    const { data, error } = await supabase.from("entries").insert({ concept, ...entry }).select('id').single();
    if (error) {
      setMessage("Commit failed.");
    } else {
      setEntries(entries => [...entries, { concept, ...entry, ...data }]);
    }
  }

  async function updateConcept() {
    if (!canCommit || concept === undefined || (!removes.length && !creates.length) || committing) {
      return;
    }

    setCommitting(true);
    const entry_remove_list = removes.map(({ id }) => id);
    const { data, error } = await supabase.rpc("update_concept", { concept, entry_remove_list, entry_create_list: creates });
    if (error) {
      setMessage(`Commit failed: ${error.message}`);
    } else {
      const removedIds = new Set(entry_remove_list);
      setEntries(entries => [...entries.filter(({ id }) => !removedIds.has(id)), ...data]);
      setRemoves(() => []);
      setCreates(() => []);
    }
    setCommitting(false);
  }

  async function createConcept() {
    if (!canCommit || concept !== undefined || creates.length === 0 || committing || !onCreateConcept) {
      return;
    }
    setCommitting(true);
    try {
      await onCreateConcept(creates);
    } catch (error) {
      setMessage(`Concept creation failed: ${error instanceof Error ? error.message : "Unknown error."}`);
    } finally {
      setCommitting(false);
    }
  }

  async function subsumeCompare() {
    if (!hasCompare) {
      return;
    }
    if (creates.length) {
      setMessage("Commit created entries before subsuming.")
      return;
    }
    const subsumed = !compareEntries.find(entry => !entries.find(({ expr }) => entry.expr === expr) && !creates.find(({ expr }) => entry.expr === expr));
    if (!subsumed && !confirm("Are you sure you want to delete this concept? This action cannot be undone.")) {
      return;
    }
    const { error } = await supabase.from("concepts").delete().eq("id", compare);
    if (error) {
      setMessage("Delete concept failed.");
    } else {
      setCompareDeleted(true);
    }
  }

  return (
    <>
      {message && <p role="status">{message}</p>}
      <div className={`row header ${compare ? "compare" : ""}`}>
        <button className={`filter ${showEmptyRows ? "active" : ""}`} type="button" aria-pressed={showEmptyRows} onClick={() => setShowEmptyRows(!showEmptyRows)}>empty rows</button>
        <div className="current">
          <span>{concept ? `Concept ${concept}` : "New concept"}</span>
          {editing && <EntryImport languages={languages} onImport={addEntries} />}
          {!editing && concept === undefined && canCommit && creates.length > 0 && <button type="button" disabled={committing} onClick={createConcept}>{committing ? "Creating..." : "Create"}</button>}
          {!editing && concept !== undefined && canCommit && (removes.length > 0 || creates.length > 0) && <button type="button" disabled={committing} onClick={updateConcept}>{committing ? "Committing..." : "Commit all"}</button>}
        </div>
        {
          hasCompare && (
            <div className="compare">
              <span>Concept {compare}</span>
              {editing && <button type="button" onClick={() => addEntries(compareEntries)}>Add all</button>}
              {!editing && canCommit && <button type="button" onClick={subsumeCompare}>Subsume</button>}
            </div>
          )
        }
      </div>
      <div>
        {
          languages.filter(([id]) => showEmptyRows || (entryGroups.get(id)?.length ?? 0) > 0 || (createGroups.get(id)?.length ?? 0) > 0 || (hasCompare && (compareEntryGroups.get(id)?.length ?? 0) > 0)).map(([id, code]) => (
            <LanguageRow key={id} lang={{ id, code }} entries={entryGroups.get(id) ?? []} removes={removes} creates={createGroups.get(id) ?? []} onRemove={onRemove} onCreate={onCreate} commitRemove={commitRemove} commitCreate={commitCreate} compare={hasCompare ? compareEntryGroups.get(id) ?? [] : undefined} editing={editing} canCommit={canCommit && concept !== undefined && !committing} />
          ))
        }
      </div>
    </>
  );
}
