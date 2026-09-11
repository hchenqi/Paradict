"use client";

import { createContext, useContext, useState } from "react";
import type { LanguageCode } from "@/lib/types";

type ActiveLanguagesState = {
  activeLanguages: LanguageCode[];
  setActiveLanguages: (languages: LanguageCode[]) => void;
};

const ActiveLanguagesContext = createContext<ActiveLanguagesState>({
  activeLanguages: [],
  setActiveLanguages: () => undefined,
});

export function ActiveLanguagesProvider({ children }: { children: React.ReactNode; }) {
  const [activeLanguages, setActiveLanguages] = useState<LanguageCode[]>([]);
  return (
    <ActiveLanguagesContext.Provider value={{ activeLanguages, setActiveLanguages }} >
      {children}
    </ActiveLanguagesContext.Provider>
  );
}

export function useActiveLanguages() {
  return useContext(ActiveLanguagesContext);
}
