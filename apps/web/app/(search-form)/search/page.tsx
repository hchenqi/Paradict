"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Entry } from "@/lib/types";
import { useLanguages } from "@/app/LanguageProvider";
import { supabase } from "@/lib/client";
import ConceptList from "../ConceptList";

function Search({ setQuery, setLanguageList, setEntries, setMessage }: { setQuery: (query: string) => void; setLanguageList: (languageList: string[]) => void; setEntries: (entries: Entry[]) => void; setMessage: (message: string) => void; }) {
  const { languageCodeIdMap } = useLanguages();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("q");
    const query = q?.trim().normalize('NFC') ?? "";
    if (!query) { return setMessage("Invalid search parameters."); }

    const lang = searchParams.get("lang");
    const languages = lang ? lang.split(",") : [];
    if (languages.length > 20) { return setMessage("No more than 20 languages could be selected."); }
    const language_list = languages.map(code => languageCodeIdMap.get(code)).filter(id => id !== undefined);

    const limit = Number(searchParams.get("limit"));
    const result_limit = Number.isInteger(limit) && limit >= 20 && limit <= 100 ? limit : 20;

    setEntries([]);
    setMessage("Searching...");

    supabase.rpc("search", { query, language_list, result_limit }).then(({ data, error }) => {
      if (error) {
        setMessage(`Error: ${error.message}.`);
      } else {
        setQuery(query);
        setLanguageList(languages);
        setEntries(data);
        setMessage("");
      }
    });
  }, [languageCodeIdMap, searchParams]);

  return null;
}

export default function () {
  const [query, setQuery] = useState("");
  const [languageList, setLanguageList] = useState<string[]>([])
  const [entries, setEntries] = useState<Entry[]>([]);
  const [message, setMessage] = useState("Loading...");

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  return (
    <>
      <Suspense><Search setQuery={setQuery} setLanguageList={setLanguageList} setEntries={setEntries} setMessage={setMessage} /></Suspense>
      {
        message ? (
          <div className="empty">{message}</div>
        ) : (
          <>
            <ConceptList entries={entries} languageList={languageList} query={query} />
          </>
        )
      }
    </>
  );
}
