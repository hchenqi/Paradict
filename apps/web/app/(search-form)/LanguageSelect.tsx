"use client";

import { useState, useRef, useEffect } from "react";
import { languageLabel } from "@/lib/types";
import { useLanguages, useSelectedLanguages, useActiveLanguages } from "@/app/LanguageProvider";
import "./LanguageSelect.css";

function optionLabel(code: string) {
  const name = languageLabel(code);
  return <>{name === code ? "" : name}<span>{code}</span></>;
}

export default function () {
  const { languages } = useLanguages();
  const [selectedLanguages, setSelectedLanguages] = useSelectedLanguages();
  const [activeLanguages, setActiveLanguages] = useActiveLanguages();
  const [dragged, setDragged] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

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

  function toggleSelected(code: string) {
    const nextSelected = selectedLanguages.includes(code) ? selectedLanguages.filter(item => item !== code) : [...selectedLanguages, code];
    setSelectedLanguages(nextSelected);
    setActiveLanguages(selectedLanguages.includes(code) ? activeLanguages.filter(item => item !== code) : [...activeLanguages, code]);
  }

  function toggleActive(code: string) {
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
    setActiveLanguages(nextSelected.filter(code => activeLanguages.includes(code)));
  }

  return (
    <section className="language-select" aria-label="Language select">
      <div className="row">
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
        <button className={`popup ${selectedLanguages.length ? "" : "hint"}`} ref={toggleRef} type="button" onClick={() => setOpen(open => !open)} aria-expanded={open}>All languages</button>
      </div>
      {
        open && (
          <div className="row popup" ref={popupRef}>
            {
              languages.map(([id, code]) => (
                <button
                  key={id}
                  className={`pill static ${selectedLanguages.includes(code) ? "selected" : ""}`}
                  type="button"
                  aria-pressed={selectedLanguages.includes(code)}
                  onClick={() => toggleSelected(code)}
                >
                  {optionLabel(code)}
                </button>
              ))
            }
          </div>
        )
      }
    </section>
  );
}
