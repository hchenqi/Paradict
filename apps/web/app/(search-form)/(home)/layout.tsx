"use client";

import { useExplore } from "@/app/ExploreProvider";
import { useActiveLanguages } from "@/app/LanguageProvider";
import ConceptList from "../ConceptList";

export default function ({ children }: { children: React.ReactNode; }) {
  const entries = useExplore();
  const [activeLanguages] = useActiveLanguages();
  return (
    <>
      {children}
      <div className="heading">Explore</div>
      <ConceptList entries={entries} languageList={activeLanguages} />
    </>
  );
}
