"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Entry } from "@/lib/types";
import { supabase } from "@/lib/client";

const ExploreContext = createContext<Entry[]>([]);

export function useExplore() {
  return useContext(ExploreContext);
}

export function ExploreProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    supabase.rpc("explore", { result_limit: 10 })
      .then(({ data: entries, error }) => { if (!error) { setEntries(entries); } });
  }, []);

  return (
    <ExploreContext.Provider value={entries} >
      {children}
    </ExploreContext.Provider>
  );
}
