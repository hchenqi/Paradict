"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useActiveLanguages } from "../LanguageProvider";
import "./layout.css";

function SearchRouter({ setInput, value, activeLanguages }: { setInput: (value: string) => void, value: string, activeLanguages: string[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const query = searchParams.get("q") ?? "";
    setInput(query);
  }, [searchParams, setInput]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const query = value.trim();
      if (query) {
        const urlQuery = pathname === "/search" ? searchParams.get("q") ?? "" : "";
        const urlLanguages = pathname === "/search" ? searchParams.get("lang") ?? "" : "";
        if (pathname !== "/search" || query !== urlQuery || (activeLanguages.length && activeLanguages.join(",") !== urlLanguages)) {
          router.replace(`/search?q=${encodeURIComponent(query)}&lang=${activeLanguages.join(",")}`);
        }
      } else {
        if (pathname !== "/explore") {
          router.replace("/explore");
        }
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams, value, activeLanguages, router]);

  return null;
}

export default function ({ children }: { children: React.ReactNode }) {
  const [activeLanguages] = useActiveLanguages();
  const [input, setInput] = useState("");
  const [value, setValue] = useState("");
  const composing = useRef(false);

  useEffect(() => {
    if (!composing.current) {
      setValue(input);
    }
  }, [input]);

  return (
    <>
      <Suspense><SearchRouter setInput={setInput} value={value} activeLanguages={activeLanguages} /></Suspense>
      <form className={`search-form ${!activeLanguages.length ? "disabled" : ""}`} onSubmit={event => event.preventDefault()}>
        <span className="icon" aria-hidden="true">⌕</span>
        <input
          aria-label="Search"
          value={input}
          onFocus={event => requestAnimationFrame(() => event.target.scrollIntoView({ behavior: "smooth", block: "start" }))}
          onBlur={() => composing.current = false}
          onChange={event => setInput(event.target.value)}
          onCompositionStart={() => composing.current = true}
          onCompositionEnd={event => { composing.current = false; setValue(event.currentTarget.value); }}
          placeholder={activeLanguages.length ? "Search" : "Select a language first"}
        />
        {input && (<button className="clear" type="button" onClick={() => setInput("")} aria-label="Clear search">×</button>)}
      </form>
      <section className="result" aria-live="polite">
        {children}
      </section>
    </>
  );
}
