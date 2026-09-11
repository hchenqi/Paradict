"use client";

import { createContext, useContext, useState } from "react";
import { LanguageCode } from "@/lib/types";

type ActiveLanguageListState = {
  activeLanguageList: LanguageCode[];
  setActiveLanguageList: (activeLanguageList: LanguageCode[]) => void;
};

const ActiveLanguageListContext = createContext<ActiveLanguageListState>({
  activeLanguageList: [],
  setActiveLanguageList: () => {}
});

export function ActiveLanguageListProvider({ children }: { children: React.ReactNode }) {
  const [activeLanguageList, setActiveLanguageList] = useState<LanguageCode[]>([]);

  return (
    <ActiveLanguageListContext.Provider value={{ activeLanguageList, setActiveLanguageList }}>
      {children}
    </ActiveLanguageListContext.Provider>
  );
}

export function useActiveLanguageList() {
  return useContext(ActiveLanguageListContext);
}
