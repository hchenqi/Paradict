import Link from "next/link";
import { search } from "@/lib/server";
import { groupEntriesByConcept } from "@/lib/types";
import ConceptList from "../ConceptList";

export default async function ({ searchParams }: { searchParams: Promise<{ q?: string; lang?: string }>; }) {
  const { q, lang } = await searchParams;
  const query = q?.trim() ?? "";
  const languages = lang ? lang.split(",") : [];

  if (!query) {
    return <div className="empty">Invalid search parameters.</div>;
  }

  if (!languages.length) {
    return <div className="empty">Select languages to search.</div>;
  }

  if (languages.length > 20) {
    return <div className="empty">No more than 20 languages could be selected.</div>;
  }

  const entries = await search(query, languages, 20);
  const concepts = groupEntriesByConcept(entries);
  return (
    <>
      <div className="heading">Search results: {concepts.size}</div>
      <ConceptList concepts={concepts} languages={languages} query={query} />
      <Link className="suggest" href={`/concept/create`}>Suggest a new concept</Link>
    </>
  );
}
