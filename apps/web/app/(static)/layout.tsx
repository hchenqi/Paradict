import "./layout.css"

export default function ({ children }: { children: React.ReactNode; }) {
  return (
    <main>
      <article>
        {children}
      </article>
    </main>
  );
}
