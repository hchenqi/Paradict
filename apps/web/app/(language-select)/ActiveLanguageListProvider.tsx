"use client";

import { createContext, useContext, useState } from "react";
import type { LanguageCode } from "@/lib/types";

type ActiveLanguageListState = {
  activeLanguageList: LanguageCode[];
  setActiveLanguageList: (languages: LanguageCode[]) => void;
};

const ActiveLanguageListContext = createContext<ActiveLanguageListState>({
  activeLanguageList: [],
  setActiveLanguageList: () => undefined,
});

export function ActiveLanguageListProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeLanguageList, setActiveLanguageList] = useState<LanguageCode[]>(
    [],
  );
  return (
    <ActiveLanguageListContext.Provider
      value={{ activeLanguageList, setActiveLanguageList }}
    >
      {children}
    </ActiveLanguageListContext.Provider>
  );
}

export function useActiveLanguageList() {
  return useContext(ActiveLanguageListContext);
}
