"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function () {
  const [query, setQuery] = useState("");
  const [languages, setLanguages] = useState<
    Array<{ code: LanguageCode; id: number }>
  >([]);
  const [selectedLanguages, setSelectedLanguages] = useState<LanguageCode[]>(
    [],
  );
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);
  const [results, setResults] = useState<Concept[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [languageIdsByCode, setLanguageIdsByCode] = useState<
    Record<string, number>
  >({});
  const searchFormRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") ?? "");
    const fromUrl = params.get("languages")?.split(",");
    void fetch("/api/languages")
      .then(async (languageResponse) => {
        const languagePayload = (await languageResponse.json()) as {
          languages?: Array<{ id: number; iso_code: string }>;
        };
        const availableLanguages = (languagePayload.languages ?? []).map(
          (language) => ({ code: language.iso_code, id: language.id }),
        );
        setLanguages(availableLanguages);
        const idMap = Object.fromEntries(
          availableLanguages.map((language) => [language.code, language.id]),
        );
        setLanguageIdsByCode(idMap);
        const availableCodes = availableLanguages.map(
          (language) => language.code,
        );
        const validFromUrl = fromUrl?.filter((code): code is LanguageCode =>
          availableCodes.includes(code),
        );
        const storedActive = localStorage.getItem(
          "paradict-active-languages",
        );
        const storedSelected = localStorage.getItem(
          "paradict-selected-languages",
        );
        const activeCodes = storedActive
          ? (JSON.parse(storedActive) as string[]).filter(
            (code): code is LanguageCode => availableCodes.includes(code),
          )
          : (validFromUrl ?? []);
        const supabase = getSupabaseBrowserClient();
        const session = supabase
          ? (await supabase.auth.getSession()).data.session
          : null;
        const profileResponse = session
          ? await fetch("/api/me", { cache: "no-store" })
          : null;
        const profilePayload = profileResponse?.ok
          ? ((await profileResponse.json()) as {
            profile?: { languages?: number[] } | null;
          })
          : null;
        setIsLoggedIn(Boolean(session));
        const profileCodes = (profilePayload?.profile?.languages ?? [])
          .map(
            (id) =>
              availableLanguages.find((language) => language.id === id)?.code,
          )
          .filter((code): code is LanguageCode => Boolean(code));
        const selectedCodes = storedSelected
          ? (JSON.parse(storedSelected) as string[]).filter(
            (code): code is LanguageCode => availableCodes.includes(code),
          )
          : profileCodes.length
            ? profileCodes
            : activeCodes;
        setSelectedLanguages(selectedCodes);
        setActiveLanguages(
          activeCodes.filter((code) => selectedCodes.includes(code)),
        );
        const url = new URL(window.location.href);
        url.searchParams.set("languages", activeCodes.join(","));
        window.history.replaceState({}, "", url);
      })
      .catch(() => undefined)
      .finally(() => setIsLoadingLanguages(false));
  }, []);
  useEffect(() => {
    if (!activeLanguages.length) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    const controller = new AbortController();
    setIsSearching(true);
    const endpoint = query.trim()
      ? `/api/search?q=${encodeURIComponent(query)}&languages=${activeLanguages.join(",")}`
      : "/api/explore";
    const timeout = window.setTimeout(() => {
      void fetch(
        endpoint,
        { signal: controller.signal },
      )
        .then(async (response) =>
          response.ok
            ? (response.json() as Promise<{ concepts?: Concept[] }>)
            : null,
        )
        .then((payload) => setResults(payload?.concepts ?? []))
        .finally(() => setIsSearching(false))
        .catch(() => undefined);
    }, 300);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, activeLanguages]);

  useEffect(() => {
    if (isLoadingLanguages) return;
    const url = new URL(window.location.href);
    if (activeLanguages.length)
      url.searchParams.set("languages", activeLanguages.join(","));
    else url.searchParams.delete("languages");
    window.history.replaceState({}, "", url);
  }, [activeLanguages, isLoadingLanguages]);

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    if (nextQuery.trim()) {
      requestAnimationFrame(() =>
        searchFormRef.current?.scrollIntoView({ block: "start" }),
      );
    }
    const url = new URL(window.location.href);
    if (nextQuery.trim()) url.searchParams.set("q", nextQuery.trim());
    else url.searchParams.delete("q");
    if (activeLanguages.length)
      url.searchParams.set("languages", activeLanguages.join(","));
    else url.searchParams.delete("languages");
    window.history.replaceState({}, "", url);
  }
  function updateLanguages(next: LanguageCode[]) {
    setActiveLanguages(next);
    if (next.length)
      localStorage.setItem(
        "paradict-active-languages",
        JSON.stringify(next),
      );
    else localStorage.removeItem("paradict-active-languages");
  }

  function updateSelectedLanguages(next: LanguageCode[]) {
    setSelectedLanguages(next);
    if (next.length)
      localStorage.setItem(
        "paradict-selected-languages",
        JSON.stringify(next),
      );
    else localStorage.removeItem("paradict-selected-languages");
    const languageIds = next
      .map((language) => languageIdsByCode[language])
      .filter((id): id is number => Number.isInteger(id))
      .slice(0, 20);
    if (isLoggedIn && languageIds.length === next.length)
      void fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languageIds }),
      });
  }

  return (
    <React.Fragment>
      <section className={`hero ${query.trim() ? "hero-searching" : ""}`}>
        {!query.trim() && (
          <>
            <p className="eyebrow">A dictionary of shared meaning</p>
            <h1>
              Find the word.
              <br />
              <em>Keep the meaning.</em>
            </h1>
            <p className="lede">
              Search across languages and browse the concepts that connect them.
            </p>
          </>
        )}
        <form
          ref={searchFormRef}
          className={`search-form ${!activeLanguages.length ? "search-disabled" : ""}`}
          onSubmit={(event) => event.preventDefault()}
        >
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            aria-label="Search the dictionary"
            autoFocus={Boolean(activeLanguages.length)}
            disabled={isLoadingLanguages || !activeLanguages.length}
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder={
              activeLanguages.length
                ? "Search a word, like bank or Wasser"
                : "Activate a language to search"
            }
          />
          {query && (
            <button
              className="clear-button"
              type="button"
              onClick={() => updateQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          <kbd>⌘ K</kbd>
        </form>
        {!isLoadingLanguages && !activeLanguages.length && (
          <p className="search-hint">
            Select an active language above to enable search.
          </p>
        )}
      </section>
      <section className="results" aria-live="polite">
        {isLoadingLanguages ? (
          <div className="loading-state" role="status">
            Loading languages...
          </div>
        ) : !activeLanguages.length ? (
          <div className="empty-state">
            <span className="empty-mark">+</span>
            <h2>Select a language to search</h2>
            <p>Choose one or more languages above.</p>
          </div>
        ) : isSearching ? (
          <div className="loading-state" role="status">
            Searching concepts...
          </div>
        ) : !results.length ? (
          <div className="empty-state">
            <span className="empty-mark">?</span>
            <h2>No shared meaning found</h2>
            <p>Try a different spelling or enable another language.</p>
          </div>
        ) : (
          <>
            <div className="results-heading">
              <span className="eyebrow">
                {query.trim() ? "Search results" : "Explore concepts"}
              </span>
              {query.trim() && (
                <span className="result-count">
                  {results.length} concept{results.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
            {results.map((concept) => (
              <article className="concept-card" key={concept.id}>
                <div className="concept-heading">
                  <Link
                    href={`/concepts?concept_id=${concept.id}&languages=${activeLanguages.join(",")}`}
                    className="concept-title"
                  >
                    Concept {concept.id}
                  </Link>
                </div>
                <div className="entries-grid">
                  {groupEntriesByLanguage(concept, activeLanguages).map(
                    (group) => (
                      <div className="entry" key={group.language}>
                        <div className="entry-language">
                          {languageLabel(group.language, group.language)}
                        </div>
                        <div className="entry-words">
                          {group.entries.map((entry) => (
                            <span className="entry-word" key={entry.id}>
                              {highlight(entry.text, query)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </article>
            ))}
            {query.trim() && (
              <Link
                className="submission-cta"
                href={`/submissions?type=create_concept&languages=${activeLanguages.join(",")}`}
              >
                Suggest a new concept
              </Link>
            )}
          </>
        )}
      </section>
    </React.Fragment>
  );
}
