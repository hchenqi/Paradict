"use client";

import { useExplore } from "@/app/ExploreProvider";
import ConceptList from "../ConceptList";
import "./page.css";

export default function () {
  const entries = useExplore();
  return (
    <>
      <div className="heading explore">Explore</div>
      <ConceptList entries={entries} />
    </>
  );
}
