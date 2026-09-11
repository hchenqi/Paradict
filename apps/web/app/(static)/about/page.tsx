import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="shell info-page">
      <header className="topbar">
        <Link className="brand" href="/">
          paradict<span>.</span>
        </Link>
        <Link className="back-link" href="/">
          Back to dictionary
        </Link>
      </header>
      <article className="info-content">
        <p className="eyebrow">About</p>
        <h1>A dictionary of shared meaning.</h1>
        <p>
          Paradict connects words across languages through the concepts they
          describe, so you can explore meaning instead of translating one word
          at a time.
        </p>
        <p>
          The project is built for clear, searchable language data and
          thoughtful contributions from its community.
        </p>
      </article>
      <InfoFooter />
    </main>
  );
}

function InfoFooter() {
  return (
    <footer>
      <span>Paradict / language-neutral concepts</span>
      <span>
        <Link href="/impressum">Impressum</Link> ·{" "}
        <Link href="/contact">Contact</Link>
      </span>
    </footer>
  );
}
