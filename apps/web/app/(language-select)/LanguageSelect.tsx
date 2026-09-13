"use client";

import { useState, useRef, useEffect } from "react";
import { languageLabel, type LanguageCode } from "@/lib/types";
import { useAvailableLanguages, useSelectedLanguages, useActiveLanguages } from "./LanguageProvider";
import "./LanguageSelect.css";

function optionLabel(code: LanguageCode) {
  const name = languageLabel(code);
  return name === code ? name : `${name} (${code})`;
}

export default function () {
  const [availableLanguages, setAvailableLanguages] = useAvailableLanguages();
  const [selectedLanguages, setSelectedLanguages] = useSelectedLanguages();
  const [activeLanguages, setActiveLanguages] = useActiveLanguages();
  const [dragged, setDragged] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetch("/api/languages")
      .then(response => response.json() as Promise<LanguageCode[]>)
      .then(availableLanguages => {
        setAvailableLanguages(availableLanguages.sort((a, b) => languageLabel(a).localeCompare(languageLabel(b))));
        const codes = new Set(availableLanguages);
        const stored = JSON.parse(localStorage.getItem("selected-languages") ?? "[]") as string[];
        const fromUrl = new URLSearchParams(window.location.search).get("languages")?.split(",") ?? [];
        const initial = (stored.length ? stored : fromUrl).filter(code => codes.has(code));
        setSelectedLanguages(initial);
        setActiveLanguages(initial);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (open) {
      function close(event: MouseEvent) {
        if (!popupRef.current?.contains(event.target as Node) && !toggleRef.current?.contains(event.target as Node)) {
          setOpen(false);
        }
      }
      document.addEventListener("mousedown", close);
      return () => document.removeEventListener("mousedown", close);
    }
  }, [open]);

  function toggleSelected(code: LanguageCode) {
    const nextSelected = selectedLanguages.includes(code) ? selectedLanguages.filter(item => item !== code) : [...selectedLanguages, code];
    setSelectedLanguages(nextSelected);
    localStorage.setItem("selected-languages", JSON.stringify(nextSelected));
    setActiveLanguages(selectedLanguages.includes(code) ? activeLanguages.filter(item => item !== code) : [...activeLanguages, code]);
  }

  function toggleActive(code: LanguageCode) {
    setActiveLanguages(activeLanguages.includes(code) ? activeLanguages.filter(item => item !== code) : selectedLanguages.filter(curr => curr === code || activeLanguages.includes(curr)));
  }

  function move(code: string, target: string) {
    const nextSelected = [...selectedLanguages];
    const sourceIndex = nextSelected.indexOf(code);
    const targetIndex = nextSelected.indexOf(target);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) { return; }
    nextSelected.splice(sourceIndex, 1);
    nextSelected.splice(targetIndex, 0, code);
    setSelectedLanguages(nextSelected);
    localStorage.setItem("selected-languages", JSON.stringify(nextSelected));
    setActiveLanguages(nextSelected.filter(code => activeLanguages.includes(code)));
  }

  return (
    <section className="language-bar" aria-label="Language filters">
      <div className="language-selector-rows">
        <div className="language-row selected-language-row">
          <span className="filter-label">Search in</span>
          {
            selectedLanguages.map(code => (
              <button
                className={`language-pill ${activeLanguages.includes(code) ? "selected" : "language-inactive"} ${dragged === code ? "dragging" : ""}`}
                draggable
                key={code}
                type="button"
                aria-pressed={activeLanguages.includes(code)}
                onClick={() => toggleActive(code)}
                onDragStart={event => { event.dataTransfer.setData("text/plain", code); setDragged(code); }}
                onDragEnd={() => setDragged(null)}
                onDragOver={event => event.preventDefault()}
                onDrop={event => move(event.dataTransfer.getData("text/plain"), code)}
              >
                {languageLabel(code)}
              </button>
            ))
          }
          <button ref={toggleRef} className="available-toggle" type="button" onClick={() => setOpen(open => !open)} aria-expanded={open}>
            {open ? "Hide languages" : "Available languages"}
          </button>
        </div>
        {
          open && (
            <div ref={popupRef} className="language-popup">
              <div className="language-row">
                {availableLanguages.map(language => (
                  <button
                    className={`language-add ${selectedLanguages.includes(language) ? "added" : ""}`}
                    key={language}
                    type="button"
                    aria-pressed={selectedLanguages.includes(language)}
                    onClick={() => toggleSelected(language)}
                  >
                    {optionLabel(language)}
                  </button>
                ))}
              </div>
            </div>
          )
        }
      </div>
    </section>
  );
}
