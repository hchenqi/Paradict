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
      return <div className="empty">No result</div>;
    } else {
      const concepts = groupEntriesByConcept(entries);
      return (
        <>
          <div className="heading">Search results</div>
          <ConceptList concepts={concepts} languages={languages} query={query} />
          <Link className="suggest" href={`/concept/create`}>Suggest a new concept</Link>
        </>
      );
    }
  } else {
    return <div className="empty">{languages.length ? "Invalid search parameters" : "Select languages to search"}</div>
  }
}
