"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  return (
    <div className="empty-state">
      <h2>Something went wrong.</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
