import Link from "next/link";

export default function () {
  return (
    <article>
      <h1>About</h1>
      <p>
        Paradict is a free multilingual dictionary organized around
        language-neutral concepts. A concept groups words and phrases that
        express a related meaning across languages, making it possible to
        explore connections that a word-for-word dictionary may miss.
      </p>
      <h2>How to use</h2>
      <ul>
        <li>
          <strong>Choose languages:</strong> Use the language selector to
          choose which languages to search and display. Your choices are saved
          in this browser.
        </li>
        <li>
          <strong>Explore concepts:</strong> Browse the{" "}
          <Link href="/explore">Explore</Link> page for a random selection of
          concepts.
        </li>
        <li>
          <strong>Search:</strong> Enter a word or phrase in the search box.
          Matching entries are grouped into concepts; open a concept from the
          results to see related words and phrases across languages.
        </li>
        <li>
          <strong>View and compare concepts:</strong> On a concept page, use the
          language filter to change which rows of languages are shown. Select a concept
          from the search results or enter its ID in the comparison control to
          compare it against another concept.
        </li>
        <li>
          <strong>Contribute:</strong> Registered users can suggest a new
          concept or edit an existing concept and submit changes for review.
        </li>
      </ul>
      <h2>Learn more</h2>
      <p>
        For detailed usage, contribution, and license information,
        see <Link href="/terms">Terms and Conditions</Link>.
      </p>
    </article>
  );
}
