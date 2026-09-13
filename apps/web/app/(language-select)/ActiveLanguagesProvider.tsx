"use client";

import { createContext, useContext, useState } from "react";
import type { LanguageCode } from "@/lib/types";

const ActiveLanguagesContext = createContext<{
  activeLanguages: LanguageCode[];
  setActiveLanguages: (languages: LanguageCode[]) => void;
}>({
  activeLanguages: [],
  setActiveLanguages: () => undefined,
});

export function useActiveLanguages() {
  return useContext(ActiveLanguagesContext);
}

export function ActiveLanguagesProvider({ children }: { children: React.ReactNode; }) {
  const [activeLanguages, setActiveLanguages] = useState<LanguageCode[]>([]);
  return (
    <ActiveLanguagesContext.Provider value={{ activeLanguages, setActiveLanguages }} >
      {children}
    </ActiveLanguagesContext.Provider>
  );
}
