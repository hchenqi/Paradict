import Link from "next/link";

export default function () {
  return (
    <article>
      <h1>About</h1>
      <p>
        Paradict is a free multilingual dictionary organized around
        language-neutral concepts. A concept groups words and phrases that
        express the same meaning across languages, making it possible to
        explore connections that a word-for-word dictionary may miss.
      </p>
      <p>
        The initial data was seeded from the PanLex dataset and it may contain
        gaps, mistakes or inappropriate contents.
        Contributions are welcome to help improve the dictionary.
      </p>
      <h2>Concepts and expressions</h2>
      <p>
        Each concept represents one meaning, while its entries are the
        expressions used to convey that meaning in particular languages, for
        example, English “water”, French “eau”, and Spanish “agua”. One
        expression can have more than one sense and appear in different
        concepts: “bank” in English can mean a financial institution or the
        land beside a river.
      </p>
      <p>
        We focus on genuine synonyms and translations that appear in natural languages.
        For technical terms and abbreviations such as “HTML”, “GPS”, or “Wi-Fi”
        that are used unchanged in multiple languages, there is also no need to have an entry
        for each language with the identical expression.
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
