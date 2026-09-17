"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { languageLabel, type LanguageCode } from "@/lib/types";
import { languagesAction } from "./actions";

const AvailableLanguagesContext = createContext<LanguageCode[]>([]);
const SelectedLanguagesContext = createContext<[LanguageCode[], (languages: LanguageCode[]) => void]>([[], () => undefined]);
const ActiveLanguagesContext = createContext<[LanguageCode[], (languages: LanguageCode[]) => void]>([[], () => undefined]);

export function useAvailableLanguages() { return useContext(AvailableLanguagesContext); }
export function useSelectedLanguages() { return useContext(SelectedLanguagesContext); }
export function useActiveLanguages() { return useContext(ActiveLanguagesContext); }

export function LanguageProvider({ children }: { children: React.ReactNode; }) {
  const [availableLanguages, setAvailableLanguages] = useState<LanguageCode[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<LanguageCode[]>([]);
  const [activeLanguages, setActiveLanguages] = useState<LanguageCode[]>([]);

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
      const languages = await languagesAction();
      setAvailableLanguages(languages.sort((a, b) => languageLabel(a).localeCompare(languageLabel(b))));
      const availableLanguagesSet = new Set(languages);
      const selectedLanguages = (JSON.parse(localStorage.getItem("selected-languages") ?? "[]") as string[]).filter(language => availableLanguagesSet.has(language));
      const activeLanguages = (JSON.parse(localStorage.getItem("active-languages") ?? "[]") as string[]).filter(language => selectedLanguages.includes(language));
      updateSelectedLanguages(selectedLanguages);
      updateActiveLanguages(activeLanguages);
    })();
  }, []);

  return (
    <AvailableLanguagesContext.Provider value={availableLanguages}>
      <SelectedLanguagesContext.Provider value={[selectedLanguages, updateSelectedLanguages]}>
        <ActiveLanguagesContext.Provider value={[activeLanguages, updateActiveLanguages]} >
          {children}
        </ActiveLanguagesContext.Provider>
      </SelectedLanguagesContext.Provider>
    </AvailableLanguagesContext.Provider>
  );
}
