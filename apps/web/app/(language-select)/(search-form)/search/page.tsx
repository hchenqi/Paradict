import Link from "next/link";
import { search } from "@/lib/server";
import { groupEntriesByConcept } from "@/lib/types";
import ConceptList from "../ConceptList";

export default async function ({ searchParams }: { searchParams: Promise<{ q?: string; lang?: string }>; }) {
  const { q, lang } = await searchParams;
  const query = q?.trim() ?? "";
  const languages = lang ? lang.split(",") : [];

  if (query && languages.length && languages.length <= 20) {
    const entries = await search(query, languages, 20);
    if (entries.length === 0) {
      return (
        <div>
          <h2>No result</h2>
        </div>
      );
    } else {
      const concepts = groupEntriesByConcept(entries);
      return (
        <>
          <div><span>Search results</span></div>
          <ConceptList concepts={concepts} languages={languages} query={query} />
          <Link href={`/concept/create`}>Suggest a new concept</Link>
        </>
      );
    }
  } else {
    return (
      <div>
        <h2>{ languages.length? "Invalid search parameters" : "Select languages to search" }</h2>
      </div>
    );
  }
}
