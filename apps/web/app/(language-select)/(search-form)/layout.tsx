"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useActiveLanguages } from "../LanguageProvider";
import "./layout.css";

export default function ({ children }: { children: React.ReactNode }) {
  const [activeLanguages] = useActiveLanguages();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = pathname === "/search" ? searchParams.get("q") ?? "" : "";
  const urlLanguages = pathname === "/search" ? searchParams.get("lang") ?? "" : "";
  const [input, setInput] = useState(urlQuery);
  const [value, setValue] = useState(input);
  const router = useRouter();
  const composing = useRef(false);

  useEffect(() => {
    setInput(urlQuery);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!composing.current) {
      setValue(input);
    }
  }, [input]);

  useEffect(() => {
    const query = value.trim();

    const timeout = setTimeout(() => {
      if (query) {
        if (pathname !== "/search" || query !== urlQuery || activeLanguages.join(",") !== urlLanguages) {
          router.replace(`/search?q=${encodeURIComponent(query)}&lang=${activeLanguages.join(",")}`);
        }
      } else {
        if (pathname !== "/explore") {
          router.replace("/explore");
        }
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [activeLanguages, pathname, searchParams, value, router]);

  return (
    <>
      <form className={`search-form ${!activeLanguages.length ? "search-disabled" : ""}`} onSubmit={event => event.preventDefault()}>
        <span className="search-icon" aria-hidden="true">⌕</span>
        <input
          aria-label="Search"
          disabled={!activeLanguages.length}
          value={input}
          onFocus={event => requestAnimationFrame(() => event.target.scrollIntoView({ behavior: "smooth", block: "start" }))}
          onChange={event => setInput(event.target.value)}
          onCompositionStart={() => composing.current = true}
          onCompositionEnd={event => { composing.current = false; setValue(event.currentTarget.value); }}
          placeholder={activeLanguages.length ? "Search" : "Select a language first"}
        />
        {input && (<button className="clear-button" type="button" onClick={() => setInput("")} aria-label="Clear search">×</button>)}
      </form>
      {children}
    </>
  );
}
