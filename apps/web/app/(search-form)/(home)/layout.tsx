"use client";

import { useExplore } from "@/app/ExploreProvider";
import ConceptList from "../ConceptList";

export default function ({ children }: { children: React.ReactNode; }) {
  const entries = useExplore();
  return (
    <>
      {children}
      <div className="heading">Explore</div>
      <ConceptList entries={entries} />
    </>
  );
}
