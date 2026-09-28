"use client";

import { useEffect, useMemo, useState } from "react";
import { getConceptEntries, supabase } from "@/lib/client";
import { Entry, EntryCreate, EntryRemove, languageLabel } from "@/lib/types";
import "./ConceptEdit.css";

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
                {editing && <button type="button" onClick={() => onRemove(!removed, { id: entry.id })} aria-label={`${removed ? "Restore" : "Remove"}`}>{removed ? "+" : "-"}</button>}
                {!editing && canCommit && removed && <button type="button" onClick={() => commitRemove(entry)}>Commit</button>}
              </div>
            );
          })
        }
        {
          creates.map(entry => (
            <div className={`entry created`} key={entry.expr}>
              <span>{entry.expr}</span>
              {editing && <button type="button" onClick={() => onCreate(true, entry)} aria-label="Remove">-</button>}
              {!editing && canCommit && <button type="button" onClick={() => commitCreate(entry)}>Commit</button>}
            </div>
          ))
        }
        {
          editing && (
            <form onSubmit={event => {
              event.preventDefault();
              const form = event.currentTarget;
              const expr = new FormData(form).get("create") as string;
              onCreate(false, { lang: lang.id, expr });
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
}) {
  const [message, setMessage] = useState("");

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
        <span className="current">{concept ? `Concept ${concept}` : "New concept"}</span>
        {
          hasCompare && (
            <div className="compare">
              <span>Concept {compare}</span>
              {canCommit && <button type="button" onClick={subsumeCompare}>Subsume</button>}
            </div>
          )
        }
      </div>
      <div>
        {
          languages.map(([id, code]) => (
            <LanguageRow key={id} lang={{ id, code }} entries={entryGroups.get(id) ?? []} removes={removes} creates={createGroups.get(id) ?? []} onRemove={onRemove} onCreate={onCreate} commitRemove={commitRemove} commitCreate={commitCreate} compare={hasCompare ? compareEntryGroups.get(id) ?? [] : undefined} editing={editing} canCommit={canCommit} />
          ))
        }
      </div>
    </>
  );
}
