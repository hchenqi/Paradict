import Link from "next/link";

export default function ContactPage() {
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
        <p className="eyebrow">Contact</p>
        <h1>Talk to the project.</h1>
        <p>
          For corrections, suggestions, data questions, or partnership
          enquiries, email{" "}
          <a href="mailto:hello@paradict.example">hello@paradict.example</a>.
        </p>
        <p>
          When reporting a dictionary issue, include the concept link and the
          languages involved.
        </p>
      </article>
      <InfoFooter />
    </main>
  );
}

function InfoFooter() {
  return (
    <footer>
      <span>Paradict / contact</span>
      <span>
        <Link href="/about">About</Link> ·{" "}
        <Link href="/impressum">Impressum</Link>
      </span>
    </footer>
  );
}
