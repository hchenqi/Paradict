"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { languageLabel } from "@/lib/types";
import { languagesAction } from "./actions";

const LanguagesContext = createContext<{ languages: [number, string][]; languageIdCodeMap: Map<number, string>; languageCodeIdMap: Map<string, number>; }>({ languages: [], languageIdCodeMap: new Map(), languageCodeIdMap: new Map() });
const SelectedLanguagesContext = createContext<[string[], (languages: string[]) => void]>([[], () => undefined]);
const ActiveLanguagesContext = createContext<[string[], (languages: string[]) => void]>([[], () => undefined]);

export function useLanguages() { return useContext(LanguagesContext); }
export function useSelectedLanguages() { return useContext(SelectedLanguagesContext); }
export function useActiveLanguages() { return useContext(ActiveLanguagesContext); }

export function LanguageProvider({ children }: { children: React.ReactNode; }) {
  const [languages, setLanguages] = useState<[number, string][]>([]);
  const languageIdCodeMap = useMemo(() => new Map(languages), [languages]);
  const languageCodeIdMap = useMemo(() => new Map(languages.map(([id, code]) => [code, id])), [languages]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [activeLanguages, setActiveLanguages] = useState<string[]>([]);

  function updateSelectedLanguages(selectedLanguages: string[]) {
    setSelectedLanguages(selectedLanguages);
    localStorage.setItem("selected-languages", JSON.stringify(selectedLanguages));
  }

  function updateActiveLanguages(activeLanguages: string[]) {
    setActiveLanguages(activeLanguages);
    localStorage.setItem("active-languages", JSON.stringify(activeLanguages));
  }

  useEffect(() => {
    (async function () {
      const languages = await languagesAction();
      setLanguages(languages.sort(([, a], [, b]) => languageLabel(a).localeCompare(languageLabel(b))));
      const languagesSet = new Set(languages.map(([, code]) => code));
      const selectedLanguages = (JSON.parse(localStorage.getItem("selected-languages") ?? "[]") as string[]).filter(language => languagesSet.has(language));
      const activeLanguages = (JSON.parse(localStorage.getItem("active-languages") ?? "[]") as string[]).filter(language => selectedLanguages.includes(language));
      updateSelectedLanguages(selectedLanguages);
      updateActiveLanguages(activeLanguages);
    })();
  }, []);

  return (
    <LanguagesContext.Provider value={{ languages, languageIdCodeMap, languageCodeIdMap }}>
      <SelectedLanguagesContext.Provider value={[selectedLanguages, updateSelectedLanguages]}>
        <ActiveLanguagesContext.Provider value={[activeLanguages, updateActiveLanguages]} >
          {children}
        </ActiveLanguagesContext.Provider>
      </SelectedLanguagesContext.Provider>
    </LanguagesContext.Provider>
  );
}
