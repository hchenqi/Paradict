"use client";

import { useExplore } from "@/app/ExploreProvider";
import ConceptList from "../ConceptList";

export default function () {
  const entries = useExplore();
  return (
    <>
      <div className="heading">Explore</div>
      <ConceptList entries={entries} />
    </>
  );
}
