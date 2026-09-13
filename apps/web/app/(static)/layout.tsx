import "./layout.css"

export default function ({ children }: { children: React.ReactNode; }) {
  return (
    <main className="info-page">
      <article className="info-content">
        {children}
      </article>
    </main>
  );
}
