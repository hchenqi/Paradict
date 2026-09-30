"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Entry } from "@/lib/types";
import { useLanguages } from "@/app/LanguageProvider";
import { supabase } from "@/lib/client";
import ConceptList from "../ConceptList";

function Search({ setQuery, setEntries, setMessage }: { setQuery: (query: string) => void; setEntries: (entries: Entry[]) => void; setMessage: (message: string) => void; }) {
  const { languageCodeIdMap } = useLanguages();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("q");
    const query = q?.trim() ?? "";
    const lang = searchParams.get("lang");
    const languages = lang ? lang.split(",") : [];

    if (!query) {
      return setMessage("Invalid search parameters.");
    }

    if (!languages.length) {
      return setMessage("Select languages to search.");
    }

    if (languages.length > 20) {
      return setMessage("No more than 20 languages could be selected.");
    }

    const language_list = languages.map(code => languageCodeIdMap.get(code)).filter(id => id !== undefined);
    if (language_list.length === 0) {
      return setMessage("Invalid language codes.");
    }

    setEntries([]);
    setMessage("Searching...");

    supabase.rpc("search", { query, language_list, result_limit: 20 }).then(({ data, error }) => {
      if (error) {
        setMessage(error.message);
      } else {
        setQuery(query);
        setEntries(data);
        setMessage("");
      }
    });
  }, [languageCodeIdMap, searchParams]);

  return null;
}

export default function () {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [message, setMessage] = useState("Loading...");

  return (
    <>
      <Suspense><Search setQuery={setQuery} setEntries={setEntries} setMessage={setMessage} /></Suspense>
      {
        message ? (
          <div className="empty">{message}</div>
        ) : (
          <>
            <div className="heading">Search results:</div>
            <ConceptList entries={entries} query={query} />
            <Link className="suggest" href={`/concept/create`}>Suggest a new concept</Link>
          </>
        )
      }
    </>
  );
}
