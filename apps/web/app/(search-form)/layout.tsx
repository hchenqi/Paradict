"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useActiveLanguages } from "@/app/LanguageProvider";
import LanguageSelect from "./LanguageSelect";
import "./layout.css";

function SearchRouter({ setInput, query, setQuery }: { setInput: (input: string) => void, query: string, setQuery: (query: string) => void }) {
  const [activeLanguages] = useActiveLanguages();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const query = searchParams.get("q") ?? "";
    if (query) {
      setInput(query);
      setQuery(query);
    }
  }, [searchParams]);

  useEffect(() => {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    if (query) {
      const urlQuery = pathname === "/search" ? searchParams.get("q") ?? "" : "";
      const urlLanguages = pathname === "/search" ? searchParams.get("lang") ?? "" : "";
      if (pathname !== "/search" || query !== urlQuery || (activeLanguages.length && activeLanguages.join(",") !== urlLanguages)) {
        router.replace(`/search?q=${encodeURIComponent(query)}${activeLanguages.length ? `&lang=${activeLanguages.join(",")}` : ""}`);
      }
    }
  }, [query, activeLanguages, router]);

  return null;
}

export default function ({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  return (
    <main>
      <Suspense><SearchRouter setInput={setInput} query={query} setQuery={setQuery} /></Suspense>
      <form className="search-form" onSubmit={event => { event.preventDefault(); setQuery(input.trim()); }}>
        <input aria-label="Search" value={input} onChange={event => setInput(event.target.value)} placeholder="Search" />
        <button type="submit" className="icon">⌕</button>
      </form>
      <LanguageSelect />
      <section className="result" aria-live="polite">
        {children}
      </section>
    </main>
  );
}
