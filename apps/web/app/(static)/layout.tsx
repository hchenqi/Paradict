import "./layout.css"

export default function ({ children }: { children: React.ReactNode; }) {
  return (
    <main className="info">
      {children}
    </main>
  );
}
