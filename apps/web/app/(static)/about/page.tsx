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
      <p>
        The starting dictionary data comes from{" "}
        <a href="https://huggingface.co/datasets/cointegrated/panlex-meanings">
          cointegrated/panlex-meanings
        </a>
        , a dataset derived from PanLex and published under CC0 1.0 according
        to its dataset card. Dictionary data may be incomplete or contain
        errors.
      </p>

      <h2>How to use Paradict</h2>
      <ol>
        <li>
          Enter a word or phrase in the search box. Search results show concepts
          containing matching entries.
        </li>
        <li>
          Choose the languages you want to explore with the language selector.
          Your language choices are saved in this browser.
        </li>
        <li>
          Open a concept to view its entries. On a concept page, use the
          language filter to change which language rows are displayed; compare
          concepts by selecting a concept or entering its ID.
        </li>
      </ol>
      <p>
        You can also browse the{" "}
        <Link href="/explore">Explore page</Link> for a random selection of concepts.
      </p>

      <h2>Suggest a correction or addition</h2>
      <p>
        Sign up with an email address to suggest new concepts or changes to
        existing entries. Open a concept and choose <strong>Edit</strong>, or
        use the suggestion link on the search results page. Submit your
        proposal for review; accepted proposals are added to the public
        dictionary. Submitting a proposal means agreeing to the{" "}
        <Link href="/terms">Terms and Conditions</Link>, including the CC0 1.0
        license for contributions. Do not submit private or confidential
        information.
      </p>

      <h2>Accounts and privacy</h2>
      <p>
        Browsing and searching do not require an account. An account is needed
        to submit contributions. The site uses necessary authentication cookies
        for sign-in and does not use advertising or analytics cookies. See the{" "}
        <Link href="/privacy">Privacy Policy</Link> for details about account
        and service data.
      </p>

      <p>
        Ready to explore? <Link href="/explore">Browse concepts</Link> or{" "}
        <Link href="/login?mode=signup">create an account</Link> to contribute.
      </p>
    </article>
  );
}
