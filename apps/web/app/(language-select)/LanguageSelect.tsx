"use client";

import { useState, useRef, useEffect } from "react";
import { languageLabel, type LanguageCode } from "@/lib/types";
import { useAvailableLanguages, useSelectedLanguages, useActiveLanguages } from "./LanguageProvider";
import "./LanguageSelect.css";

function optionLabel(code: LanguageCode) {
  const name = languageLabel(code);
  return name === code ? <span>{name}</span> : <>{name}<span>{code}</span></>;
}

export default function () {
  const [availableLanguages, setAvailableLanguages] = useAvailableLanguages();
  const [selectedLanguages, setSelectedLanguages] = useSelectedLanguages();
  const [activeLanguages, setActiveLanguages] = useActiveLanguages();
  const [dragged, setDragged] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  function updateSelectedLanguages(selectedLanguages: LanguageCode[]) {
    setSelectedLanguages(selectedLanguages);
    localStorage.setItem("selected-languages", JSON.stringify(selectedLanguages));
  }

  function updateActiveLanguages(activeLanguages: LanguageCode[]) {
    setActiveLanguages(activeLanguages);
    localStorage.setItem("active-languages", JSON.stringify(activeLanguages));
  }

  useEffect(() => {
    (async function () {
      const response = await fetch("/api/languages");
      const languages = await response.json() as LanguageCode[];
      setAvailableLanguages(languages.sort((a, b) => languageLabel(a).localeCompare(languageLabel(b))));
      const availableLanguagesSet = new Set(languages);
      const selectedLanguages = (JSON.parse(localStorage.getItem("selected-languages") ?? "[]") as string[]).filter(language => availableLanguagesSet.has(language));
      const activeLanguages = (JSON.parse(localStorage.getItem("active-languages") ?? "[]") as string[]).filter(language => selectedLanguages.includes(language));
      updateSelectedLanguages(selectedLanguages);
      updateActiveLanguages(activeLanguages);
    })();
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
    updateSelectedLanguages(nextSelected);
    updateActiveLanguages(selectedLanguages.includes(code) ? activeLanguages.filter(item => item !== code) : [...activeLanguages, code]);
  }

  function toggleActive(code: LanguageCode) {
    updateActiveLanguages(activeLanguages.includes(code) ? activeLanguages.filter(item => item !== code) : selectedLanguages.filter(curr => curr === code || activeLanguages.includes(curr)));
  }

  function move(code: string, target: string) {
    const nextSelected = [...selectedLanguages];
    const sourceIndex = nextSelected.indexOf(code);
    const targetIndex = nextSelected.indexOf(target);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) { return; }
    nextSelected.splice(sourceIndex, 1);
    nextSelected.splice(targetIndex, 0, code);
    updateSelectedLanguages(nextSelected);
    updateActiveLanguages(nextSelected.filter(code => activeLanguages.includes(code)));
  }

  return (
    <section className="language-select" aria-label="Language select">
      <div className="row">
        <span className="label">Search in</span>
        {
          selectedLanguages.map(code => (
            <button
              className={`pill draggable ${dragged === code ? "dragging" : ""} ${activeLanguages.includes(code) ? "active" : "inactive"}`}
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
        <button className="popup" ref={toggleRef} type="button" onClick={() => setOpen(open => !open)} aria-expanded={open}>
          {open ? "Hide languages" : "Available languages"}
        </button>
      </div>
      {
        open && (
          <div className="row popup" ref={popupRef}>
            {
              availableLanguages.map(language => (
                <button
                  className={`pill static ${selectedLanguages.includes(language) ? "selected" : ""}`}
                  key={language}
                  type="button"
                  aria-pressed={selectedLanguages.includes(language)}
                  onClick={() => toggleSelected(language)}
                >
                  {optionLabel(language)}
                </button>
              ))
            }
          </div>
        )
      }
    </section>
  );
}
