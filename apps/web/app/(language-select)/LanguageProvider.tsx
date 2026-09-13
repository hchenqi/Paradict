"use client";

import { createContext, useContext, useState } from "react";
import type { LanguageCode } from "@/lib/types";

type LanguagesContext = [LanguageCode[], (languages: LanguageCode[]) => void];

const SelectedLanguagesContext = createContext<LanguagesContext>([[], () => undefined]);
const ActiveLanguagesContext = createContext<LanguagesContext>([[], () => undefined]);
const AvailableLanguagesContext = createContext<LanguagesContext>([[], () => undefined]);

export function useAvailableLanguages() { return useContext(AvailableLanguagesContext); }
export function useSelectedLanguages() { return useContext(SelectedLanguagesContext); }
export function useActiveLanguages() { return useContext(ActiveLanguagesContext); }

export function LanguageProvider({ children }: { children: React.ReactNode; }) {
  const [availableLanguages, setAvailableLanguages] = useState<LanguageCode[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<LanguageCode[]>([]);
  const [activeLanguages, setActiveLanguages] = useState<LanguageCode[]>([]);
  return (
    <AvailableLanguagesContext.Provider value={[availableLanguages, setAvailableLanguages]}>
      <SelectedLanguagesContext.Provider value={[selectedLanguages, setSelectedLanguages]}>
        <ActiveLanguagesContext.Provider value={[activeLanguages, setActiveLanguages]} >
          {children}
        </ActiveLanguagesContext.Provider>
      </SelectedLanguagesContext.Provider>
    </AvailableLanguagesContext.Provider>
  );
}
