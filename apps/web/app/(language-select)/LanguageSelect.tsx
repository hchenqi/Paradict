"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { languageLabel, type LanguageCode } from "@/lib/types";
import { useActiveLanguageList } from "./ActiveLanguageListProvider";

type Language = { iso_code: LanguageCode };

function optionLabel(code: LanguageCode) {
  const name = languageLabel(code);
  return name.toLowerCase() === code.toLowerCase()
    ? name
    : `${name} (${code})`;
}

export default function LanguageSelect() {
  const { activeLanguageList, setActiveLanguageList } = useActiveLanguageList();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selected, setSelected] = useState<LanguageCode[]>([]);
  const [open, setOpen] = useState(false);
  const [dragged, setDragged] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/languages", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ languages?: Language[] }>)
      .then((payload) => {
        const available = payload.languages ?? [];
        setLanguages(available);
        const codes = new Set(available.map((language) => language.iso_code));
        const stored = JSON.parse(
          localStorage.getItem("paradict-selected-languages") ?? "[]",
        ) as string[];
        const fromUrl = new URLSearchParams(window.location.search)
          .get("languages")?.split(",") ?? [];
        const initial = (stored.length ? stored : fromUrl).filter((code) =>
          codes.has(code),
        );
        setSelected(initial);
        setActiveLanguageList(initial);
      })
      .catch(() => undefined);
  }, [setActiveLanguageList]);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!popupRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const available = useMemo(
    () => [...languages].sort((a, b) => optionLabel(a.iso_code).localeCompare(optionLabel(b.iso_code))),
    [languages],
  );

  function updateActive(next: LanguageCode[]) {
    setActiveLanguageList(next);
    const url = new URL(window.location.href);
    if (next.length) url.searchParams.set("languages", next.join(","));
    else url.searchParams.delete("languages");
    window.history.replaceState({}, "", url);
  }

  function toggleMembership(code: LanguageCode) {
    const nextSelected = selected.includes(code)
      ? selected.filter((item) => item !== code)
      : [...selected, code];
    setSelected(nextSelected);
    localStorage.setItem("paradict-selected-languages", JSON.stringify(nextSelected));
    updateActive(nextSelected);
  }

  function move(code: string, target: string) {
    const next = [...activeLanguageList];
    const sourceIndex = next.indexOf(code);
    const targetIndex = next.indexOf(target);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;
    next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, code);
    setSelected(next);
    localStorage.setItem("paradict-selected-languages", JSON.stringify(next));
    updateActive(next);
  }

  function toggleActive(code: LanguageCode) {
    updateActive(
      activeLanguageList.includes(code)
        ? activeLanguageList.filter((item) => item !== code)
        : [...activeLanguageList, code],
    );
  }

  return (
    <section className="language-bar" aria-label="Language filters">
      <div className="language-selector-rows">
        <div className="language-row selected-language-row">
          <span className="filter-label">Search in</span>
          {selected.map((code) => (
            <button
              className={`language-pill ${activeLanguageList.includes(code) ? "selected" : "language-inactive"} ${dragged === code ? "dragging" : ""}`}
              draggable
              key={code}
              type="button"
              aria-pressed={activeLanguageList.includes(code)}
              onClick={() => toggleActive(code)}
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", code);
                setDragged(code);
              }}
              onDragEnd={() => setDragged(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => move(event.dataTransfer.getData("text/plain"), code)}
            >
              {languageLabel(code)}
            </button>
          ))}
          <div className="language-control" ref={popupRef}>
            <button className="available-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
              {open ? "Hide languages" : "Available languages"}
            </button>
            {open && (
              <div className="language-popup">
                <div className="language-row available-language-row">
                  {available.map((language) => (
                    <button
                      className={`language-add ${selected.includes(language.iso_code) ? "added" : ""}`}
                      key={language.iso_code}
                      type="button"
                      aria-pressed={selected.includes(language.iso_code)}
                      onClick={() => toggleMembership(language.iso_code)}
                    >
                      {optionLabel(language.iso_code)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
