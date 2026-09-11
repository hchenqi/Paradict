import Link from "next/link";

export default function ImpressumPage() {
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
        <p className="eyebrow">Impressum</p>
        <h1>Legal notice</h1>
        <p>Paradict is an independent dictionary project.</p>
        <p>
          Operator: Paradict Project
          <br />
          Contact:{" "}
          <a href="mailto:hello@paradict.example">hello@paradict.example</a>
        </p>
        <p>
          Replace these placeholder details with the responsible person or
          organisation before publishing the site.
        </p>
      </article>
      <InfoFooter />
    </main>
  );
}

function InfoFooter() {
  return (
    <footer>
      <span>Paradict / legal information</span>
      <span>
        <Link href="/about">About</Link> · <Link href="/contact">Contact</Link>
      </span>
    </footer>
  );
}
