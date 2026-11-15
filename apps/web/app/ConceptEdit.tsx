"use client";

import { Ref, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import { ConceptEntry, ConceptOperation, languageLabel } from "@/lib/types";
import { supabase } from "@/lib/client";
import "./ConceptEdit.css";

function useConceptLoader(concept: number | undefined, setMessage: (message: string) => void) {
  const [entries, setEntries] = useState<ConceptEntry[]>([]);

  useEffect(() => {
    setEntries([]);
    if (concept) {
      let mounted = true;
      supabase.rpc("read_concept", { concept_id: concept })
        .then(({ data: entries, error }) => { if (mounted) { if (!error) { setEntries(entries); } else { setMessage("Concept does not exist."); } } })
      return () => { mounted = false; };
    }
  }, [concept]);

  return entries;
}

function normalizeExpr(expr: string) {
  return expr.normalize("NFC").replace(/[\t\n\r]/g, " ").replace(/\p{Cc}/gu, "").replace(/ {2,}/g, " ").trim();
}

function EntryImport({ languages, onImport }: { languages: [number, string][]; onImport: (entries: ConceptEntry[]) => void; }) {
  const languageCodeIdMap = useMemo(() => new Map(languages.map(([id, code]) => [code, id])), [languages]);
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();

  function importEntries(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const parsed: unknown = JSON.parse(json);
      if (!Array.isArray(parsed)) { throw new Error("JSON must be a list of entries."); }
      const imported = new Map<string, ConceptEntry>();
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
          <dialog ref={dialogRef} aria-labelledby={id} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) { dialogRef.current?.close(); } }}>
            <h2 id={id}>Import entries from JSON</h2>
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
  editing,
  deleting,
}: {
  lang: { id: number; code: string };
  entries: string[];
  removes: string[];
  creates: string[];
  onRemove: (remove: boolean, entry: ConceptEntry) => void;
  onCreate: (remove: boolean, entry: ConceptEntry) => void;
  editing: boolean;
  deleting: boolean;
}) {
  return (
    <div className={`row ${deleting ? "disabled" : ""}`} aria-label={languageLabel(lang.code)}>
      <div className="entries">
        {
          entries.map(expr => {
            const removed = removes.includes(expr);
            return (
              <div className={`entry ${removed ? "removed" : ""}`} key={expr}>
                <span>{expr}</span>
                {editing && <button type="button" disabled={deleting} onClick={() => onRemove(!removed, { lang: lang.id, expr })} aria-label={`${removed ? "Restore" : "Remove"} ${expr}`}>{removed ? "+" : "-"}</button>}
              </div>
            );
          })
        }
        {
          creates.map(expr => (
            <div className="entry created" key={expr}>
              <span>{expr}</span>
              {editing && <button type="button" disabled={deleting} onClick={() => onCreate(true, { lang: lang.id, expr })} aria-label={`Remove ${expr}`}>-</button>}
            </div>
          ))
        }
        {
          editing && (
            <form onSubmit={event => {
              event.preventDefault();
              const form = event.currentTarget;
              const expr = normalizeExpr(new FormData(form).get("create") as string);
              if (expr) { onCreate(false, { lang: lang.id, expr }); }
            }}>
              <input name="create" aria-label={`Add expression in ${lang.code}`} disabled={deleting} />
              <button type="submit" disabled={deleting}>Add</button>
            </form>
          )
        }
      </div>
    </div>
  );
}

type PanelHandle = {
  getOperation: () => ConceptOperation | null;
};

function Panel({
  ref,
  self,
  languages,
  visibleLanguages,
  onLanguagesChange,
  initial,
  editing,
}: {
  ref: Ref<PanelHandle>;
  self: {
    column: number;
    setMain: () => void;
    move: (direction: -1 | 1) => void;
    remove: () => void;
  };
  languages: [number, string][];
  visibleLanguages: [number, string][];
  onLanguagesChange: (languages: number[]) => void;
  initial: ConceptOperation;
  editing: boolean;
}) {
  const [message, setMessage] = useState("");

  const concept = initial.type !== "create" ? initial.concept : undefined;
  const entries = useConceptLoader(concept, setMessage);

  const [removes, setRemoves] = useState<ConceptEntry[]>(initial.type === "update" ? initial.removes : []);
  const [creates, setCreates] = useState<ConceptEntry[]>(initial.type !== "delete" ? initial.creates : []);
  const [deleting, setDeleting] = useState(initial.type === "delete");

  const entryGroups = useMemo(() => Map.groupBy(entries, entry => entry.lang), [entries]);
  const removeGroups = useMemo(() => Map.groupBy(removes, entry => entry.lang), [removes]);
  const createGroups = useMemo(() => Map.groupBy(creates, entry => entry.lang), [creates]);

  useEffect(() => {
    onLanguagesChange([...new Set([...entries.map(entry => entry.lang), ...creates.map(entry => entry.lang)])]);
  }, [entries, creates, onLanguagesChange]);

  useImperativeHandle(ref, () => ({
    getOperation: () => {
      if (concept === undefined) {
        if (!deleting) {
          return creates.length > 0 ? { "type": "create", creates } : null;
        } else {
          return null;
        }
      } else {
        if (!deleting) {
          return removes.length > 0 || creates.length > 0 ? { "type": "update", concept, removes, creates } : null;
        } else {
          return { "type": "delete", concept };
        }
      }
    }
  }), [concept, removes, creates, deleting]);

  function onRemove(remove: boolean, entry: ConceptEntry) {
    if (remove) {
      setRemoves(removes => [...removes, entry]);
    } else {
      setRemoves(removes => removes.filter(({ lang, expr }) => !(lang === entry.lang && expr === entry.expr)));
    }
  }

  function onCreate(remove: boolean, entry: ConceptEntry) {
    if (!remove) {
      if (entries.find(({ lang, expr }) => lang === entry.lang && expr === entry.expr)) {
        onRemove(false, entry);
      } else {
        if (!creates.find(({ lang, expr }) => lang === entry.lang && expr === entry.expr)) {
          setCreates(creates => [...creates, entry]);
        }
      }
    } else {
      setCreates(creates => creates.filter(({ lang, expr }) => !(lang === entry.lang && expr === entry.expr)));
    }
  }

  function addEntries(entries: ConceptEntry[]) {
    setRemoves(removes => removes.filter(({ lang, expr }) => !entries.find(entry => lang === entry.lang && expr === entry.expr)));
    setCreates(creates => [...creates, ...entries.filter(({ lang, expr }) => !creates.find(entry => lang === entry.lang && expr === entry.expr))]);
  }

  return (
    <div className="panel" style={{ gridColumn: self.column + 2, gridRow: "1 / -1" }} aria-label={concept ? `Concept ${concept}` : "New concept"}>
      {message && <p role="status">{message}</p>}
      <div className="row header">
        <div className="title">
          <span className="name">{concept ? `Concept ${concept}` : "New concept"}</span>
          {
            editing && (
              <div className="actions edit">
                <EntryImport languages={languages} onImport={addEntries} />
                <button type="button" aria-pressed={deleting} onClick={() => setDeleting(!deleting)}>{deleting ? "Restore" : "Delete"}</button>
              </div>
            )
          }
        </div>
        <div className="actions">
          {self.column !== 0 && <button type="button" onClick={self.setMain}>Set as main</button>}
          <button type="button" onClick={() => self.move(-1)} aria-label="Move left">←</button>
          <button type="button" onClick={() => self.move(1)} aria-label="Move right">→</button>
          <button type="button" onClick={self.remove} aria-label="Remove panel">×</button>
        </div>
      </div>
      {
        visibleLanguages.map(([id, code]) => (
          <LanguageRow key={id} lang={{ id, code }} entries={(entryGroups.get(id) ?? []).map(entry => entry.expr)} removes={(removeGroups.get(id) ?? []).map(entry => entry.expr)} creates={(createGroups.get(id) ?? []).map(entry => entry.expr)} onRemove={onRemove} onCreate={onCreate} editing={editing} deleting={deleting} />
        ))
      }
    </div>
  );
}

export type ConceptEditHandle = {
  getOperations: () => ConceptOperation[];
};

type Panel = {
  key: string;
  operation: ConceptOperation;
};

export default function ({ ref, languages, initial, editing }: { ref: Ref<ConceptEditHandle>; languages: [number, string][]; initial: ConceptOperation[]; editing: boolean; }) {
  const [panels, setPanels] = useState<Panel[]>(() => initial.map(operation => ({ key: crypto.randomUUID(), operation })));
  const panelRefs = useRef(new Map<string, PanelHandle>());
  const [panelLanguages, setPanelLanguages] = useState<Map<string, Set<number>>>(new Map());

  const [message, setMessage] = useState("");
  const [showEmptyRows, setShowEmptyRows] = useState(false);
  const visibleLanguages = showEmptyRows ? languages : languages.filter(([id]) => [...panelLanguages.values()].some(panel => panel.has(id)));

  const editorRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function updateFullscreenState() {
      setIsFullscreen(document.fullscreenElement === editorRef.current);
    }
    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () => document.removeEventListener("fullscreenchange", updateFullscreenState);
  }, []);

  const panelGridStyle = useMemo(() => ({
    "--panel-count": panels.length,
    "--language-count": visibleLanguages.length
  } as React.CSSProperties), [panels.length, visibleLanguages.length]);

  useImperativeHandle(ref, () => ({
    getOperations: () => panels.map(panel => panelRefs.current.get(panel.key)?.getOperation()).filter(operation => !!operation)
  }), [panels]);

  function addPanel(operation: ConceptOperation) {
    setPanels([...panels, { key: crypto.randomUUID(), operation }]);
  }

  function addConcept(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const id = Number(new FormData(form).get("id"));
    if (!Number.isInteger(id) || id < 1) {
      setMessage("Invalid concept ID");
      return;
    }
    if (panels.some(panel => panel.operation.type !== "create" && panel.operation.concept === id)) {
      setMessage(`Concept ${id} already added`);
      return;
    }
    addPanel({ type: "update", concept: id, creates: [], removes: [] });
    form.reset();
  }

  async function toggleFullscreen() {
    const editor = editorRef.current;
    if (!editor) { return; }
    try {
      if (document.fullscreenElement === editor) {
        await document.exitFullscreen();
      } else {
        await editor.requestFullscreen();
      }
    } catch (error) {
      setMessage(error instanceof Error ? `Could not toggle fullscreen: ${error.message}` : "Could not toggle fullscreen.");
    }
  }

  return (
    <div className="edit" ref={editorRef}>
      <div className="controls">
        <button type="button" aria-pressed={isFullscreen} onClick={toggleFullscreen}>{isFullscreen ? "Exit fullscreen" : "Fullscreen"}</button>
        {
          editing && (
            <div>
              <form onSubmit={addConcept}>
                <input name="id" inputMode="numeric" />
                <button type="submit">Add concept</button>
              </form>
              <button type="button" onClick={() => addPanel({ type: "create", creates: [] })}>Add new concept</button>
            </div>
          )
        }
        {message && <span role="status">{message}</span>}
      </div>
      <div className="scroll">
        <div className={`grid${panels.length === 1 ? " single" : ""}`} style={panelGridStyle}>
          <div className="corner">
            <button type="button" className={`filter ${showEmptyRows ? "active" : ""}`} aria-pressed={showEmptyRows} onClick={() => setShowEmptyRows(value => !value)}>empty rows</button>
          </div>
          {
            visibleLanguages.map(([id, code], index) => (
              <div className="lang" key={id} style={{ gridColumn: 1, gridRow: index + 2 }}>{languageLabel(code)}</div>
            ))
          }
          {
            panels.map((panel, index) => (
              <Panel
                key={panel.key}
                ref={handle => { handle ? panelRefs.current.set(panel.key, handle) : panelRefs.current.delete(panel.key); return; }}
                self={{
                  column: index,
                  setMain: () => setPanels([panels[index], ...panels.filter((_, panelIndex) => panelIndex !== index)]),
                  move: direction => setPanels(current => { const index = current.findIndex(item => item.key === panel.key); const nextIndex = index + direction; if (index < 0 || nextIndex < 0 || nextIndex >= current.length) { return current; } const next = [...current];[next[index], next[nextIndex]] = [next[nextIndex], next[index]]; return next; }),
                  remove: () => {
                    setPanels(current => current.filter(item => item.key !== panel.key));
                    setPanelLanguages(current => {
                      if (!current.has(panel.key)) { return current; }
                      const next = new Map(current); next.delete(panel.key); return next;
                    });
                  },
                }}
                onLanguagesChange={ids => {
                  setPanelLanguages(current => {
                    const previous = current.get(panel.key);
                    if (previous?.size === ids.length && ids.every(id => previous.has(id))) { return current; }
                    const next = new Map(current); next.set(panel.key, new Set(ids)); return next;
                  });
                }}
                languages={languages}
                visibleLanguages={visibleLanguages}
                initial={panel.operation}
                editing={editing}
              />
            ))
          }
        </div>
      </div>
    </div>
  );
}
