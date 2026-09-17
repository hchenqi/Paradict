"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Entry } from "@/lib/types";
import { exploreAction } from "./actions";

const ExploreContext = createContext<Entry[]>([]);

export function useExplore() {
  return useContext(ExploreContext);
}

export function ExploreProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    exploreAction().then(entries => setEntries(entries));
  }, []);

  return (
    <ExploreContext.Provider value={entries} >
      {children}
    </ExploreContext.Provider>
  );
}
