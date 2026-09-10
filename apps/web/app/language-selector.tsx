"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { languageLabel, type LanguageCode } from "../lib/dictionary";

type Language = { code: LanguageCode; id: number };
type Props = {
  languages?: Language[];
  selectedLanguages: LanguageCode[];
  activeLanguages?: LanguageCode[];
  onChange?: (languages: LanguageCode[]) => void;
  onSelectedChange?: (languages: LanguageCode[]) => void;
  refreshOnChange?: boolean;
};

function languageOptionLabel(code: LanguageCode) {
  const name = languageLabel(code);
  return name.toLowerCase() === code.toLowerCase()
    ? name
    : `${name} (${code})`;
}

export default function LanguageSelector({
  languages: suppliedLanguages,
  selectedLanguages,
  activeLanguages: suppliedActiveLanguages,
  onChange,
  onSelectedChange,
  refreshOnChange = false,
}: Props) {
  const [fetchedLanguages, setFetchedLanguages] = useState<Language[]>([]);
  const [ordered, setOrdered] = useState<LanguageCode[]>(selectedLanguages);
  const [active, setActive] = useState<LanguageCode[]>(
    suppliedActiveLanguages ?? selectedLanguages,
  );
  const [open, setOpen] = useState(false);
  const [dragged, setDragged] = useState<string | null>(null);
  const initialized = useRef(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const languages = suppliedLanguages ?? fetchedLanguages;

  useEffect(() => {
    if (suppliedLanguages) return;
    void fetch("/api/languages", { cache: "no-store" })
      .then(async (response) =>
        response.ok
          ? (response.json() as Promise<{
              languages?: Array<{ id: number; iso_code: string }>;
            }>)
          : null,
      )
      .then((payload) =>
        setFetchedLanguages(
          (payload?.languages ?? []).map((language) => ({
            code: language.iso_code,
            id: language.id,
          })),
        ),
      )
      .catch(() => undefined);
  }, [suppliedLanguages]);

  useEffect(() => {
    if (
      languages.length &&
      (!initialized.current || (!ordered.length && selectedLanguages.length))
    ) {
      setOrdered(selectedLanguages);
      setActive(suppliedActiveLanguages ?? selectedLanguages);
      initialized.current = true;
    }
  }, [
    languages.length,
    ordered.length,
    selectedLanguages,
    suppliedActiveLanguages,
  ]);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(event: MouseEvent) {
      if (popupRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  });

  const available = useMemo(
    () =>
      [...languages].sort((a, b) =>
        languageLabel(a.code, a.code).localeCompare(
          languageLabel(b.code, b.code),
        ),
      ),
    [languages],
  );
  function updateActive(next: LanguageCode[]) {
    setActive(next);
    onChange?.(next);
    const url = new URL(window.location.href);
    url.searchParams.set("languages", next.join(","));
    window.history.replaceState({}, "", url);
    if (refreshOnChange) window.location.reload();
  }

  function toggleActive(code: LanguageCode) {
    updateActive(
      active.includes(code)
        ? active.filter((item) => item !== code)
        : ordered.filter((item) => item === code || active.includes(item)),
    );
  }

  function move(code: string, target: string) {
    if (!code || code === target) return;
    const next = [...ordered];
    const sourceIndex = next.indexOf(code);
    const targetIndex = next.indexOf(target);
    if (sourceIndex < 0 || targetIndex < 0) return;
    next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, code);
    setOrdered(next);
    updateActive(next.filter((item) => active.includes(item)));
    setDragged(null);
  }

  function toggleMembership(code: LanguageCode) {
    if (ordered.includes(code)) {
      setOrdered((current) => current.filter((item) => item !== code));
      updateActive(active.filter((item) => item !== code));
      onSelectedChange?.(ordered.filter((item) => item !== code));
    } else {
      setOrdered((current) => [...current, code]);
      updateActive([...active, code]);
      onSelectedChange?.([...ordered, code]);
    }
  }

  return (
    <section className="language-bar" aria-label="Language filters">
      <div className="language-selector-rows">
        <div className="language-row selected-language-row">
          <span className="filter-label">Search in</span>
          {ordered.map((code) => (
            <button
              className={`language-pill language-drag-item ${active.includes(code) ? "selected" : ""} ${dragged === code ? "dragging" : ""}`}
              draggable
              key={code}
              type="button"
              aria-pressed={active.includes(code)}
              onClick={() => toggleActive(code)}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", code);
                setDragged(code);
              }}
              onDragEnd={() => setDragged(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                move(event.dataTransfer.getData("text/plain"), code);
              }}
            >
              <span className={!active.includes(code) ? "language-inactive" : undefined}>
                {languageLabel(code, code)}
              </span>
            </button>
          ))}
          <div ref={popupRef} className="language-control">
          <button
            className="available-toggle"
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            {open ? "Hide languages" : "Available languages"}
          </button>
          {open && (
            <div className="language-popup">
              <div className="language-row available-language-row">
                {available.map((language) => (
                  <button
                    className={`language-add ${ordered.includes(language.code) ? "added" : ""}`}
                    key={language.code}
                    type="button"
                    aria-pressed={ordered.includes(language.code)}
                    onClick={() =>
                      toggleMembership(language.code)
                    }
                  >
                    {languageOptionLabel(language.code)}
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
