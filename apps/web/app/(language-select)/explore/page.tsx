import type { Metadata } from "next";
import { explore } from "@/lib/server";
import ExploreResults from "./ExploreResults";

export const metadata: Metadata = { title: "Explore | Paradict" };

export default async function ExplorePage() {
  const entries = await explore();
  return <ExploreResults entries={entries} />;
}
