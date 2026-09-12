"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getConceptAction } from "@/app/actions";
import type { Entry } from "@/lib/types";
import { useActiveLanguages } from "../../ActiveLanguagesProvider";
import ConceptCard from "../../ConceptCard";

export default function () {
  const { activeLanguages } = useActiveLanguages();
  const { id: urlId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = Number(urlId);
  const urlLanguages = searchParams.get("lang") ?? "";
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (activeLanguages.join(",") !== urlLanguages) {
      router.replace(`/concept/${id}?lang=${activeLanguages.join(",")}`);
    }
  }, [activeLanguages, searchParams, router]);

  useEffect(() => {
    if (Number.isInteger(id) && activeLanguages.length) {
      getConceptAction(id, activeLanguages).then(entries => setEntries(entries));
    } else {
      setEntries([]);
    }
  }, [searchParams]);

  return (
    <main className="concept-page">
      <section className="results concept-results">
        <ConceptCard
          conceptId={id}
          entries={entries}
          activeLanguages={activeLanguages}
        />
      </section>
    </main>
  );
}
